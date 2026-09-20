import json
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import PastQuestionUpload
from .services import process_past_question_upload


@api_view(["POST"])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def upload_past_questions(request):
    """
    Upload past question content for AI processing.
    Body: {content, subject_id, block_id (optional), topic_id (optional), file_name (optional)}
    Generates QuizQuestions and saves them to the curriculum question bank.
    """
    data = request.data
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST)
    elif not isinstance(data, dict):
        try:
            data = json.loads(request.body)
        except Exception:
            return Response({"error": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST)

    content = data.get("content", "")
    if isinstance(content, str):
        content = content.strip()
    if not content:
        return Response({"error": "content is required"}, status=status.HTTP_400_BAD_REQUEST)

    subject_id = data.get("subject_id")
    block_id = data.get("block_id")
    topic_id = data.get("topic_id")

    from curriculum.models import Subject, Block, Topic
    subject = Subject.objects.filter(id=subject_id).first() if subject_id else None
    block = Block.objects.filter(id=block_id).first() if block_id else None
    topic = Topic.objects.filter(id=topic_id).first() if topic_id else None

    upload = PastQuestionUpload.objects.create(
        uploaded_by=request.user,
        subject=subject,
        block=block,
        topic=topic,
        file_content=content,
        file_name=data.get("file_name", ""),
    )

    result = process_past_question_upload(upload.id)

    return Response({
        "upload_id": upload.id,
        "created_mcq": result.get("created_mcq", 0),
        "created_theory": result.get("created_theory", 0),
        "error": result.get("error"),
    }, status=status.HTTP_201_CREATED if not result.get("error") else status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def get_upload_status(request, upload_id):
    """Check processing status of a past question upload."""
    try:
        upload = PastQuestionUpload.objects.get(id=upload_id, uploaded_by=request.user)
    except PastQuestionUpload.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        "id": upload.id,
        "file_name": upload.file_name,
        "processed": upload.processed,
        "processing_error": upload.processing_error,
        "uploaded_at": upload.uploaded_at.isoformat(),
    }, status=status.HTTP_200_OK)
