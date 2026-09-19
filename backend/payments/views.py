"""
Paystack payment endpoints (PRD §7.3).

Postgres-native: subscription state lives on accounts.Profile and every
transaction is recorded in accounts.PaymentTransaction. The webhook is the
source of truth for activating/renewing premium server-side.
"""

import json
import hmac
import hashlib
import logging
from datetime import timedelta

import requests
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .pricing import DEFAULT_PLAN, all_plans, get_plan

logger = logging.getLogger(__name__)

PAYSTACK_SECRET = settings.PAYSTACK_SECRET_KEY
PAYSTACK_BASE = "https://api.paystack.co"


def _activate_premium(transaction):
    """Mark a transaction successful and extend the user's premium window."""
    from accounts.models import Profile, SubscriptionTier

    if transaction.status == "success":
        return  # idempotent — already processed

    transaction.status = "success"
    transaction.verified_at = timezone.now()
    transaction.save(update_fields=["status", "verified_at"])

    profile = Profile.objects.filter(user=transaction.user).first()
    if profile:
        base = profile.subscription_expires_at
        if not base or base < timezone.now():
            base = timezone.now()
        profile.subscription_tier = SubscriptionTier.PREMIUM
        profile.subscription_expires_at = base + timedelta(days=30 * transaction.subscription_months)
        profile.save(update_fields=["subscription_tier", "subscription_expires_at"])


@api_view(["GET"])
@permission_classes([AllowAny])
def plans(request):
    """Expose the catalogue so the frontend never hardcodes a price."""
    return Response({"plans": all_plans(), "default": DEFAULT_PLAN.code})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request):
    """Initialize a Paystack transaction for a named plan.

    The client sends a plan *code*, never an amount: the price is resolved on the server
    so the charged figure always matches the published one. The billing email comes from
    the authenticated account for the same reason.
    """
    from accounts.models import PaymentTransaction

    data = request.data if hasattr(request, "data") else (request.POST or json.loads(request.body or "{}"))
    plan_param = data.get("plan") or data.get("plan_code") or data.get("months")
    plan = get_plan(plan_param)
    if plan is None:
        return Response({"error": "Unknown plan"}, status=status.HTTP_400_BAD_REQUEST)

    email = request.user.email
    if not email:
        return Response({"error": "Your account has no email address"}, status=status.HTTP_400_BAD_REQUEST)

    resp = requests.post(
        f"{PAYSTACK_BASE}/transaction/initialize",
        headers={"Authorization": f"Bearer {PAYSTACK_SECRET}", "Content-Type": "application/json"},
        json={
            "email": email,
            "amount": plan.amount_kobo,
            "plan": plan.paystack_plan_code,
            "callback_url": settings.PAYSTACK_CALLBACK_URL,
            "metadata": {
                "user_id": request.user.id,
                "plan": plan.code,
                "months": plan.months,
            },
        },
        timeout=20,
    )
    result = resp.json()
    if not result.get("status"):
        return Response({"error": result.get("message", "Paystack init failed")}, status=status.HTTP_400_BAD_REQUEST)

    pdata = result["data"]
    PaymentTransaction.objects.create(
        user=request.user,
        reference=pdata["reference"],
        amount=plan.amount_naira,
        subscription_months=plan.months,
        status="pending",
    )

    return Response({
        "status": "success",
        "data": {
            "authorization_url": pdata["authorization_url"],
            "reference": pdata["reference"],
            "access_code": pdata["access_code"],
            "plan": plan.as_dict(),
        },
        "authorization_url": pdata["authorization_url"],
        "reference": pdata["reference"],
    })


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def verify(request):
    """Verify a payment by reference and activate premium on success."""
    from accounts.models import PaymentTransaction
    from accounts.serializers import ProfileSerializer

    reference = request.query_params.get("reference")
    if not reference and hasattr(request, "data") and isinstance(request.data, dict):
        reference = request.data.get("reference")

    if not reference:
        return Response({"error": "No reference"}, status=status.HTTP_400_BAD_REQUEST)

    resp = requests.get(
        f"{PAYSTACK_BASE}/transaction/verify/{reference}",
        headers={"Authorization": f"Bearer {PAYSTACK_SECRET}"},
        timeout=20,
    )
    result = resp.json()
    if not result.get("status"):
        return Response({"success": False, "error": result.get("message")}, status=status.HTTP_400_BAD_REQUEST)

    paystack_data = result["data"]
    if paystack_data.get("status") != "success":
        return Response({"success": False, "error": "Payment was not successful"}, status=status.HTTP_400_BAD_REQUEST)

    transaction = PaymentTransaction.objects.filter(reference=reference).first()
    if transaction is None:
        # A reference we never issued: never grant access off an unknown transaction.
        logger.warning("Verify called for unknown reference %s", reference)
        return Response({"success": False, "error": "Unknown transaction"}, status=status.HTTP_404_NOT_FOUND)

    if not _amount_matches(transaction, paystack_data):
        return Response(
            {"success": False, "error": "Paid amount does not match the plan"}, status=status.HTTP_400_BAD_REQUEST
        )

    _activate_premium(transaction)
    profile = getattr(transaction.user, "profile", None)
    return Response({
        "success": True,
        "status": "success",
        "message": "Premium activated",
        "user": ProfileSerializer(profile).data if profile else None,
    }, status=status.HTTP_200_OK)


def _amount_matches(transaction, paystack_data) -> bool:
    """Confirm Paystack actually collected what the plan costs.

    Verification previously trusted only the `status` field, so a transaction created
    for one amount could be settled for another. Comparing against the amount we
    recorded at checkout closes that gap.
    """
    try:
        paid_kobo = int(paystack_data.get("amount", 0))
    except (TypeError, ValueError):
        return False

    expected_kobo = int(transaction.amount) * 100
    if paid_kobo < expected_kobo:
        logger.warning(
            "Amount mismatch on %s: paid %s kobo, expected %s kobo",
            transaction.reference, paid_kobo, expected_kobo,
        )
        return False
    return True


@csrf_exempt
@require_http_methods(["POST"])
def webhook(request):
    """Paystack webhook — the server-side source of truth (PRD §7.3)."""
    from accounts.models import PaymentTransaction

    payload = request.body
    sig_header = request.META.get("HTTP_X_PAYSTACK_SIGNATURE", "")

    expected = hmac.new(PAYSTACK_SECRET.encode(), payload, hashlib.sha512).hexdigest()
    if not hmac.compare_digest(expected, sig_header):
        logger.warning("Rejected Paystack webhook with bad signature")
        return HttpResponse(status=401)

    try:
        event = json.loads(payload.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return HttpResponse(status=400)

    if event.get("event") == "charge.success":
        payload_data = event.get("data", {})
        reference = payload_data.get("reference")
        transaction = PaymentTransaction.objects.filter(reference=reference).first()
        if transaction and _amount_matches(transaction, payload_data):
            _activate_premium(transaction)
            logger.info("Premium activated via webhook for %s", reference)
        elif transaction:
            logger.warning("Webhook amount mismatch for %s; not activating", reference)

    return HttpResponse(status=200)
