"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faBookOpen,
  faListCheck,
  faTrophy,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { loadCurriculum, breadcrumb } from "@/lib/curriculum";
import { getSlidesForCourse } from "@/lib/slides";

interface SearchResult {
  id: string;
  title: string;
  type: "course" | "slide" | "quiz" | "flashcard" | "steeplechase";
  url: string;
  description: string;
  subject?: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [searchItems, setSearchItems] = useState<SearchResult[]>([]);

  // Build search index from live curriculum + slides data
  useEffect(() => {
    async function buildSearchIndex() {
      try {
        const subjects = await loadCurriculum();
        const items: SearchResult[] = [];

        // Add courses
        subjects.forEach((subject) => {
          subject.blocks.forEach((block) => {
            if (subject.id === "biochemistry") {
              items.push({
                id: block.id,
                title: block.title,
                type: "course",
                url: `/courses/${block.id}`,
                description: `${subject.title} · ${block.title}`,
                subject: subject.title,
              });
            } else {
              block.topics.forEach((topic) => {
                items.push({
                  id: topic.id,
                  title: topic.title,
                  type: "course",
                  url: `/courses/${topic.id}`,
                  description: `${subject.title} · ${block.title}`,
                  subject: subject.title,
                });
              });
            }
          });
        });

        // Add slides
        for (const subject of subjects) {
          for (const block of subject.blocks) {
            const courseId =
              subject.id === "biochemistry" ? block.id : block.topics[0]?.id;
            if (courseId) {
              const slides = await getSlidesForCourse(courseId);
              slides.forEach((slide) => {
                items.push({
                  id: slide.id,
                  title: slide.title,
                  type: "slide",
                  url: `/read/${courseId}/${slide.id}`,
                  description: `${breadcrumb(courseId)} · ${slide.pages} pages`,
                  subject: subject.title,
                });
              });
            }
          }
        }

        // Add quiz topics
        subjects.forEach((subject) => {
          subject.blocks.forEach((block) => {
            if (subject.id !== "biochemistry") {
              block.topics.forEach((topic) => {
                items.push({
                  id: `quiz-${topic.id}`,
                  title: `${topic.title} Quiz`,
                  type: "quiz",
                  url: `/quiz?topic=${topic.id}`,
                  description: `${subject.title} · ${block.title}`,
                  subject: subject.title,
                });
              });
            }
          });
        });

        // Add flashcards
        items.push({
          id: "flashcards",
          title: "Flashcards",
          type: "flashcard",
          url: "/flashcards",
          description: "Review spaced-repetition flashcards",
        });

        // Add steeplechase
        items.push({
          id: "steeplechase",
          title: "Steeplechase Practice",
          type: "steeplechase",
          url: "/steeplechase",
          description: "Practice with spotter questions",
        });

        setSearchItems(items);
      } catch (error) {
        console.error("Failed to build search index:", error);
      }
    }
    buildSearchIndex();
  }, []);


  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "course":
        return faBookOpen;
      case "slide":
        return faBookOpen;
      case "quiz":
        return faListCheck;
      case "flashcard":
        return faLayerGroup;
      case "steeplechase":
        return faTrophy;
      default:
        return faBookOpen;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "course":
        return "Course";
      case "slide":
        return "Slide";
      case "quiz":
        return "Quiz";
      case "flashcard":
        return "Flashcards";
      case "steeplechase":
        return "Steeplechase";
      default:
        return type;
    }
  };

  const handleSelect = (item: SearchResult) => {
    setOpen(false);
    router.push(item.url);
  };

  return (
    <>
      {/* Search trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex w-full max-w-full flex-1 min-w-0 items-center gap-3"
        aria-label="Open global search"
      >
        <label className="relative flex w-full min-w-0 items-center">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          {/* `truncate` only ellipsizes when the element it sits on is width-constrained.
              The span was inline inside a non-flex div, so the placeholder ran straight
              past the pill and out of the header. The row is now a flex container that
              actually clips, and the phone gets a placeholder that fits. */}
          <div className="flex h-10 w-full min-w-0 items-center overflow-hidden rounded-full border border-border bg-card pl-9 pr-4 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 sm:max-w-md">
            <span className="min-w-0 flex-1 truncate sm:hidden">Search…</span>
            <span className="hidden min-w-0 flex-1 truncate sm:block">
              Search axilla, glycolysis, cranial nerves…
            </span>
          </div>
        </label>
      </button>

      {/* Search dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search courses, slides, quizzes…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Group by type */}
          {["course", "slide", "quiz", "flashcard", "steeplechase"].map(
            (type) => {
              const items = searchItems.filter((item) => item.type === type);
              if (items.length === 0) return null;

              return (
                <CommandGroup
                  key={type}
                  heading={getTypeLabel(type as SearchResult["type"])}
                >
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3"
                    >
                      <FontAwesomeIcon
                        icon={getIcon(item.type)}
                        className="size-4 text-muted-foreground"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            },
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
