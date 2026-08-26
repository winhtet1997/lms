import { courseService } from "@/service/courseService";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import handleError from "@/lib/handleError";
import { runMultipartUpload } from "@/lib/multipartUpload";

export const useCourseStore = create(
  persist(
    (set, get) => ({
      subjects: [],
      fetchSubjects: async () => {
        try {
          const data = await courseService.getSubjects();
          set({ subjects: data });
        } catch (e) {
          console.error("Failed to fetch subjects:", e);
        }
      },

      courses: [],
      totalCourses: 0,
      totalChapters: 0,
      totalItems: 0,
      totalVideos: 0,
      totalDocuments: 0,
      totalActivities: 0,
      totalQuizzes: 0,
      totalScorm: 0,
      course: null,
      chapters: [],
      lessons: [],
      item: null,
      items: [],

      previewItem: null,
      setPreviewItem: (data) => set({ previewItem: data }),
      clearPreviewItem: () => set({ previewItem: null }),

      lastViewedItem: null,
      setLastViewedItem: (item) => set({ lastViewedItem: item }),

      loading: false,
      courseLoading: false,
      error: null,
      fieldErrors: {},
      itemsByGrade: {},
      itemsLoading: false,
      itemsError: null,
      itemsTotalCount: 0,
      itemsTotalPages: 1,
      sidebarGrouped: {},
      sidebarGroupedLoading: false,
      coursesTotalCount: 0,
      coursesTotalPages: 1,
      resetErrors: () => set({ error: null, fieldErrors: {} }),

      resetCourseDraft: () =>
        set({
          courseDraft: {
            id: null,
            title: "",
            description: "",
            grade: "",
            subject: "",
            publication_status: false,
            chapters: [],
          },
        }),

      loadCourseIntoDraft: (course) =>
        set({
          courseDraft: {
            id: course.id,
            title: course.title,
            description: course.description,
            grade: course.grade_level ?? "",
            subject: course.subject ? String(course.subject) : "",
            publication_status: course.publication_status ?? false,
            chapters: (course.chapters ?? []).map((ch) => ({
              id: ch.id,
              title: ch.title,
              description: ch.description ?? "",
              icon: ch.icon ?? null,
              is_free_preview: ch.is_free_preview ?? false,
              _iconFile: null,
              lessons: (ch.lessons ?? []).map((les) => ({
                id: les.id,
                title: les.title,
                description: les.description ?? "",
                items: les.items ?? [],
              })),
            })),
          },
        }),

      courseDraft: {
        id: null,
        title: "",
        description: "",
        grade: "",
        subject: "",
        publication_status: false,
        chapters: [],
      },
      setCourseField: (field, value) =>
        set((state) => ({
          courseDraft: {
            ...state.courseDraft,
            [field]: value,
          },
        })),

      togglePublishStatus: async (newValue) => {
        const { courseDraft } = get();
        if (!courseDraft.id) return;
        set({ loading: true });
        try {
          await courseService.updateCourse(courseDraft.id, {
            publication_status: newValue,
          });
          set((state) => ({
            courseDraft: { ...state.courseDraft, publication_status: newValue },
            loading: false,
          }));
        } catch (error) {
          const errMsg = handleError(error);
          set({ loading: false });
          throw error;
        }
      },

      addChapterDraft: () =>
        set((state) => ({
          courseDraft: {
            ...state.courseDraft,
            chapters: [
              ...state.courseDraft.chapters,
              {
                id: null,
                title: "",
                description: "",
                icon: null,
                is_free_preview: false,
                _iconFile: null,
                lessons: [],
              },
            ],
          },
        })),

      updateChapterDraft: (index, field, value) =>
        set((state) => ({
          courseDraft: {
            ...state.courseDraft,
            chapters: state.courseDraft.chapters.map((ch, i) =>
              i === index ? { ...ch, [field]: value } : ch
            ),
          },
        })),

      addLessonDraft: (chapterIndex) =>
        set((state) => ({
          courseDraft: {
            ...state.courseDraft,
            chapters: state.courseDraft.chapters.map((ch, i) =>
              i === chapterIndex
                ? {
                    ...ch,
                    lessons: [
                      ...ch.lessons,
                      { id: null, title: "", description: "", items: [] },
                    ],
                  }
                : ch
            ),
          },
        })),

      updateLessonDraft: (chapterIndex, lessonIndex, field, value) =>
        set((state) => ({
          courseDraft: {
            ...state.courseDraft,
            chapters: state.courseDraft.chapters.map((ch, i) =>
              i === chapterIndex
                ? {
                    ...ch,
                    lessons: ch.lessons.map((ls, j) =>
                      j === lessonIndex ? { ...ls, [field]: value } : ls
                    ),
                  }
                : ch
            ),
          },
        })),

      addItemsToLesson: (chapterIndex, lessonIndex, items) =>
        set((state) => {
          const existingIds = new Set(
            state.courseDraft.chapters[chapterIndex].lessons[lessonIndex].items.map(
              (item) => item.id
            )
          );
          const newItems = items.filter((item) => !existingIds.has(item.id));
          return {
            courseDraft: {
              ...state.courseDraft,
              chapters: state.courseDraft.chapters.map((ch, i) =>
                i === chapterIndex
                  ? {
                      ...ch,
                      lessons: ch.lessons.map((ls, j) =>
                        j === lessonIndex
                          ? { ...ls, items: [...ls.items, ...newItems] }
                          : ls
                      ),
                    }
                  : ch
              ),
            },
          };
        }),

      removeItemFromLesson: (chapterIndex, lessonIndex, itemId) =>
        set((state) => ({
          courseDraft: {
            ...state.courseDraft,
            chapters: state.courseDraft.chapters.map((ch, i) =>
              i === chapterIndex
                ? {
                    ...ch,
                    lessons: ch.lessons.map((ls, j) =>
                      j === lessonIndex
                        ? { ...ls, items: ls.items.filter((item) => item.id !== itemId) }
                        : ls
                    ),
                  }
                : ch
            ),
          },
        })),

      removeItemAndSave: async (chapterIndex, lessonIndex, itemId) => {
        // First remove from local state
        get().removeItemFromLesson(chapterIndex, lessonIndex, itemId);

        // Then save to backend
        await get().saveLessonItems(chapterIndex, lessonIndex);
      },

      reorderChapter: async (index, direction) => {
        let updatedChapters;
        set((state) => {
          const chapters = [...state.courseDraft.chapters];
          const newIndex = direction === "up" ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= chapters.length) return state;
          [chapters[index], chapters[newIndex]] = [
            chapters[newIndex],
            chapters[index],
          ];
          updatedChapters = chapters;
          return { courseDraft: { ...state.courseDraft, chapters } };
        });

        if (updatedChapters) {
          const payload = updatedChapters
            .map((ch, i) => (ch.id ? { id: ch.id, priority_index: i } : null))
            .filter(Boolean);
          if (payload.length) {
            try {
              await courseService.reorderChapters(payload);
            } catch (e) {
              console.error("Failed to persist chapter order:", e);
            }
          }
        }
      },

      reorderLesson: async (chapterIndex, lessonIndex, direction) => {
        let updatedLessons;
        set((state) => {
          const chapters = [...state.courseDraft.chapters];
          const lessons = [...chapters[chapterIndex].lessons];
          const newIndex =
            direction === "up" ? lessonIndex - 1 : lessonIndex + 1;
          if (newIndex < 0 || newIndex >= lessons.length) return state;
          [lessons[lessonIndex], lessons[newIndex]] = [
            lessons[newIndex],
            lessons[lessonIndex],
          ];
          chapters[chapterIndex] = { ...chapters[chapterIndex], lessons };
          updatedLessons = lessons;
          return { courseDraft: { ...state.courseDraft, chapters } };
        });

        if (updatedLessons) {
          const payload = updatedLessons
            .map((les, i) =>
              les.id ? { id: les.id, priority_index: i } : null,
            )
            .filter(Boolean);
          if (payload.length) {
            try {
              await courseService.reorderLessons(payload);
            } catch (e) {
              console.error("Failed to persist lesson order:", e);
            }
          }
        }
      },

      reorderItem: async (chapterIndex, lessonIndex, itemIndex, direction) => {
        let updatedItems;
        set((state) => {
          const chapters = [...state.courseDraft.chapters];
          const lessons = [...chapters[chapterIndex].lessons];
          const items = [...lessons[lessonIndex].items];
          const newIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
          if (newIndex < 0 || newIndex >= items.length) return state;
          [items[itemIndex], items[newIndex]] = [
            items[newIndex],
            items[itemIndex],
          ];
          lessons[lessonIndex] = { ...lessons[lessonIndex], items };
          chapters[chapterIndex] = { ...chapters[chapterIndex], lessons };
          updatedItems = items;
          return { courseDraft: { ...state.courseDraft, chapters } };
        });

        if (updatedItems) {
          const payload = updatedItems
            .map((item, i) =>
              item.id ? { id: item.id, priority_index: i } : null,
            )
            .filter(Boolean);
          if (payload.length) {
            try {
              await courseService.reorderItems(payload);
            } catch (e) {
              console.error("Failed to persist item order:", e);
            }
          }
        }
      },

      deleteChapter: async (chapterIndex) => {
        const { courseDraft } = get();
        const chapter = courseDraft.chapters[chapterIndex];

        // Delete from backend if it exists
        if (chapter.id) {
          try {
            await courseService.deleteChapter(chapter.id);
          } catch (error) {
            console.error("Failed to delete chapter:", error);
            throw error;
          }
        }

        // Delete from local state
        set((state) => ({
          courseDraft: {
            ...state.courseDraft,
            chapters: state.courseDraft.chapters.filter(
              (_, idx) => idx !== chapterIndex,
            ),
          },
        }));
      },

      deleteLesson: async (chapterIndex, lessonIndex) => {
        const { courseDraft } = get();
        const lesson = courseDraft.chapters[chapterIndex].lessons[lessonIndex];

        // Delete from backend if it exists
        if (lesson.id) {
          try {
            await courseService.deleteLesson(lesson.id);
          } catch (error) {
            console.error("Failed to delete lesson:", error);
            throw error;
          }
        }

        // Delete from local state
        set((state) => ({
          courseDraft: {
            ...state.courseDraft,
            chapters: state.courseDraft.chapters.map((ch, i) =>
              i === chapterIndex
                ? { ...ch, lessons: ch.lessons.filter((_, idx) => idx !== lessonIndex) }
                : ch
            ),
          },
        }));
      },

      saveLessonItems: async (chapterIndex, lessonIndex) => {
        const { courseDraft } = get();
        const lesson = courseDraft.chapters[chapterIndex].lessons[lessonIndex];

        if (!lesson.id) return;

        try {
          const itemIds = lesson.items.map((item) => item.id);
          await courseService.updateLesson(lesson.id, { items: itemIds });
        } catch (error) {
          console.error("Failed to save items to lesson:", error);
        }
      },

      initCourse: async () => {
        const { courseDraft } = get();

        if (courseDraft.id) return courseDraft.id;

        set({ loading: true });

        try {
          const data = await courseService.createCourse({
            title: courseDraft.title,
            description: courseDraft.description,
            grade_level: courseDraft.grade,
            ...(courseDraft.subject ? { subject: courseDraft.subject } : {}),
          });

          set((state) => ({
            courseDraft: {
              ...state.courseDraft,
              id: data.id,
            },
            loading: false,
          }));

          return data.id;
        } catch (error) {
          const errMsg = handleError(error);
          set({ error: errMsg, loading: false });
          throw error;
        }
      },

      uploadChapterIcon: async (chapterIndex, file) => {
        const previewUrl = URL.createObjectURL(file);
        set((state) => {
          const chapters = [...state.courseDraft.chapters];
          chapters[chapterIndex] = {
            ...chapters[chapterIndex],
            icon: previewUrl,
            _iconFile: file,
          };
          return { courseDraft: { ...state.courseDraft, chapters } };
        });

        const chapter = get().courseDraft.chapters[chapterIndex];
        if (chapter.id) {
          try {
            const result = await courseService.uploadChapterIcon(
              chapter.id,
              file,
            );
            set((state) => {
              const chapters = [...state.courseDraft.chapters];
              chapters[chapterIndex] = {
                ...chapters[chapterIndex],
                icon: result.icon,
                _iconFile: null,
              };
              return { courseDraft: { ...state.courseDraft, chapters } };
            });
          } catch (e) {
            console.error("Failed to upload chapter icon:", e);
          }
        }
      },

      removeChapterIcon: async (chapterIndex) => {
        const chapter = get().courseDraft.chapters[chapterIndex];
        set((state) => {
          const chapters = [...state.courseDraft.chapters];
          chapters[chapterIndex] = {
            ...chapters[chapterIndex],
            icon: null,
            _iconFile: null,
          };
          return { courseDraft: { ...state.courseDraft, chapters } };
        });
        if (chapter.id) {
          try {
            await courseService.updateChapter(chapter.id, { icon: null });
          } catch (e) {
            console.error("Failed to remove chapter icon:", e);
          }
        }
      },

      toggleChapterFreePreview: async (chapterIndex) => {
        const chapter = get().courseDraft.chapters[chapterIndex];
        const next = !chapter.is_free_preview;
        set((state) => {
          const chapters = [...state.courseDraft.chapters];
          chapters[chapterIndex] = {
            ...chapters[chapterIndex],
            is_free_preview: next,
          };
          return { courseDraft: { ...state.courseDraft, chapters } };
        });
        if (chapter.id) {
          try {
            await courseService.updateChapter(chapter.id, {
              is_free_preview: next,
            });
          } catch (e) {
            console.error("Failed to update chapter free preview:", e);
            set((state) => {
              const chapters = [...state.courseDraft.chapters];
              chapters[chapterIndex] = {
                ...chapters[chapterIndex],
                is_free_preview: !next,
              };
              return { courseDraft: { ...state.courseDraft, chapters } };
            });
          }
        }
      },

      saveChapter: async (chapterIndex) => {
        const { courseDraft } = get();
        const chapter = courseDraft.chapters[chapterIndex];

        if (chapter.id) return chapter.id;

        const data = await courseService.createChapter({
          title: chapter.title,
          description: chapter.description,
          course_id: courseDraft.id,
          priority_index: chapterIndex,
        });

        set((state) => ({
          courseDraft: {
            ...state.courseDraft,
            chapters: state.courseDraft.chapters.map((ch, i) =>
              i === chapterIndex ? { ...ch, id: data.id } : ch
            ),
          },
        }));

        // Upload pending icon file if one was selected before chapter was created
        const pendingFile = get().courseDraft.chapters[chapterIndex]._iconFile;
        if (pendingFile) {
          try {
            const result = await courseService.uploadChapterIcon(
              data.id,
              pendingFile,
            );
            set((state) => {
              const chapters = [...state.courseDraft.chapters];
              chapters[chapterIndex] = {
                ...chapters[chapterIndex],
                icon: result.icon,
                _iconFile: null,
              };
              return { courseDraft: { ...state.courseDraft, chapters } };
            });
          } catch (e) {
            console.error("Failed to upload chapter icon:", e);
          }
        }

        return data.id;
      },

      saveLesson: async (chapterIndex, lessonIndex) => {
        const { courseDraft } = get();
        const lesson = courseDraft.chapters[chapterIndex].lessons[lessonIndex];

        if (lesson.id) return lesson.id;

        const chapterId = await get().saveChapter(chapterIndex);

        const data = await courseService.createLesson({
          title: lesson.title,
          description: lesson.description,
          chapter_id: chapterId,
          priority_index: lessonIndex,
        });

        set((state) => ({
          courseDraft: {
            ...state.courseDraft,
            chapters: state.courseDraft.chapters.map((ch, i) =>
              i === chapterIndex
                ? {
                    ...ch,
                    lessons: ch.lessons.map((ls, j) =>
                      j === lessonIndex ? { ...ls, id: data.id } : ls
                    ),
                  }
                : ch
            ),
          },
        }));

        return data.id;
      },

      saveCourse: async () => {
        const { courseDraft } = get();

        if (!courseDraft.id) return;

        set({ loading: true });

        try {
          // Update course details
          await courseService.updateCourse(courseDraft.id, {
            title: courseDraft.title,
            description: courseDraft.description,
            grade_level: courseDraft.grade,
            ...(courseDraft.subject ? { subject: courseDraft.subject } : {}),
          });

          // Save/update all chapters
          for (let i = 0; i < courseDraft.chapters.length; i++) {
            const chapter = courseDraft.chapters[i];

            if (chapter.id) {
              // Update existing chapter
              await courseService.updateChapter(chapter.id, {
                title: chapter.title,
                description: chapter.description,
              });
            } else {
              // Create new chapter
              const chapterData = await courseService.createChapter({
                title: chapter.title,
                description: chapter.description,
                course_id: courseDraft.id,
                priority_index: i,
              });

              // Update local state with new chapter ID
              set((state) => ({
                courseDraft: {
                  ...state.courseDraft,
                  chapters: state.courseDraft.chapters.map((ch, idx) =>
                    idx === i ? { ...ch, id: chapterData.id } : ch
                  ),
                },
              }));
            }

            // Save/update all lessons in this chapter
            for (let j = 0; j < chapter.lessons.length; j++) {
              const lesson = chapter.lessons[j];

              if (lesson.id) {
                // Update existing lesson
                await courseService.updateLesson(lesson.id, {
                  title: lesson.title,
                  description: lesson.description,
                });
              } else if (lesson.title || lesson.description) {
                // Create new lesson only if it has content
                const lessonData = await courseService.createLesson({
                  title: lesson.title,
                  description: lesson.description,
                  chapter_id: chapter.id || get().courseDraft.chapters[i].id,
                  priority_index: j,
                });

                // Update local state with new lesson ID
                set((state) => ({
                  courseDraft: {
                    ...state.courseDraft,
                    chapters: state.courseDraft.chapters.map((ch, ci) =>
                      ci === i
                        ? {
                            ...ch,
                            lessons: ch.lessons.map((ls, li) =>
                              li === j ? { ...ls, id: lessonData.id } : ls
                            ),
                          }
                        : ch
                    ),
                  },
                }));
              }
            }
          }

          // Apply grade/chapter/lesson tags to all items based on current order
          try {
            await courseService.applyCourseTags(get().courseDraft.id);
          } catch (e) {
            console.error("Failed to apply course tags:", e);
          }

          set({ loading: false });
        } catch (error) {
          const errMsg = handleError(error);
          set({ error: errMsg, loading: false });
          throw error;
        }
      },

      deleteCourse: async (courseId) => {
        try {
          await courseService.deleteCourse(courseId);
          set((state) => ({
            courses: state.courses.filter((c) => c.id !== courseId),
            totalCourses: Math.max(0, state.totalCourses - 1),
          }));
        } catch (error) {
          const errMsg = handleError(error);
          set({ error: errMsg || "Failed to delete course" });
          throw error;
        }
      },

      fetchCourses: async (params = {}) => {
        set({ courseLoading: true, error: null });
        try {
          const data = await courseService.getCourses(params);

          set({
            courses: data.courses,
            totalCourses: data.total_courses,
            totalChapters: data.total_chapters,
            totalItems: data.total_items,
            coursesTotalCount: data.total_count ?? data.courses?.length ?? 0,
            coursesTotalPages: data.total_pages ?? 1,
            courseLoading: false,
            loading: false,
          });
          return data;
        } catch (error) {
          const errMsg = handleError(error);

          const apiResponse = error.response?.data;
          set({
            courses: [],
            courseLoading: false,
            error: errMsg || apiResponse?.detail || "Failed to get courses",
          });
        }
      },

      fetchCourseById: async (courseId) => {
        set({ loading: true, error: null });
        try {
          const data = await courseService.getCourseById(courseId);
          set({ course: data, loading: false });
          return data;
        } catch (error) {
          const errMsg = handleError(error);
          const apiResponse = error.response?.data;
          set({
            course: null,
            loading: false,
            error:
              errMsg || apiResponse?.detail || "Failed to get course details",
          });
        }
      },

      fetchChapter: async (chapterId) => {
        set({ loading: true, error: null, chapter : null });
        try {
          const data = await courseService.getChapter(chapterId);
          set({
            chapter: data,
            loading: false,
          });

          return data;
        } catch (error) {
          const errMsg = handleError(error);
          const apiResponse = error.response?.data;
          set({
            chapter: null,
            loading: false,
            error: errMsg || apiResponse?.detail || "Failed to get Chapter",
          });
        }
      },

      fetchItem: async (Id) => {
        set({ loading: true, error: null, item: null });
        try {
          const data = await courseService.getItem(Id);
          set({ item: data, loading: false });
          return data;
        } catch (error) {
          const errMsg = handleError(error);
          const apiResponse = error.response?.data;
          set({
            item: null,
            loading: false,
            error: errMsg || apiResponse?.detail || "Failed to get the video",
          });
        }
      },

      fetchItems: async (params = {}) => {
        set({ itemsLoading: true, itemsError: null });

        try {
          const data = await courseService.getItems(params);
          const itemsList = data.items;

          // Transform flat array into organized structure by grade and tags
          const itemsByGradeMap = {};

          itemsList.forEach((item) => {
            const gradeKey = `Grade-${item.grade_level}`;

            if (!itemsByGradeMap[gradeKey]) {
              itemsByGradeMap[gradeKey] = {
                total_items: 0,
                tags: {},
              };
            }

            itemsByGradeMap[gradeKey].total_items++;

            // Add item to each tag it belongs to
            if (item.tags && Array.isArray(item.tags)) {
              item.tags.forEach((tag) => {
                if (!itemsByGradeMap[gradeKey].tags[tag]) {
                  itemsByGradeMap[gradeKey].tags[tag] = {
                    count: 0,
                    items: [],
                  };
                }

                itemsByGradeMap[gradeKey].tags[tag].count++;
                itemsByGradeMap[gradeKey].tags[tag].items.push(item);
              });
            }
          });

          set({
            items: itemsList,
            itemsByGrade: itemsByGradeMap,
            totalItems: data.total_items,
            totalVideos: data.total_videos,
            totalDocuments: data.total_documents,
            totalActivities: data.total_activity,
            totalQuizzes: data.total_quizzes,
            totalScorm: data.total_scorm,
            itemsTotalCount: data.total_count ?? itemsList.length,
            itemsTotalPages: data.total_pages ?? 1,
            itemsLoading: false,
          });
          return data;
        } catch (error) {
          const errMsg = handleError(error);

          const apiResponse = error.response?.data;
          set({
            items: [],
            itemsByGrade: {},
            itemsLoading: false,
            itemsError: errMsg || apiResponse?.detail || "Failed to get items",
          });
        }
      },

      fetchItemsGrouped: async (params = {}) => {
        set({ sidebarGroupedLoading: true });
        try {
          const data = await courseService.getItemsGrouped(params);
          set({ sidebarGrouped: data, sidebarGroupedLoading: false });
        } catch (error) {
          set({ sidebarGrouped: {}, sidebarGroupedLoading: false });
        }
      },

      createItem: async (metaData, file) => {
        set({ loading: true, error: null });
        const onBeforeUnload = (e)=>{e.preventDefault(); e.returnValue = "";}
        if (file) window.addEventListener("beforeunload", onBeforeUnload);
        try {
          const item = await courseService.createItem(metaData);
          set({ item });
          if (file) await runMultipartUpload(file, item);
          set({ loading: false });
          return item;
        } catch (error) {
          const apiResponse = error.response?.data;
          set({
            loading: false,
            error: apiResponse ? JSON.stringify(apiResponse) : "Failed to create item",
          });
          throw error;
        } finally {
          window.removeEventListener("beforeunload", onBeforeUnload);
        }
      },

      updateItem: async (itemId, metaData, file) => {
        set({ loading: true, error: null });
        const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ""; };
        if (file) window.addEventListener("beforeunload", onBeforeUnload);
        try {
          const item = await courseService.updateItem(itemId, metaData);
          if (file) await runMultipartUpload(file, item);
          set({ loading: false });
        } catch (error) {
          const apiResponse = error.response?.data;
          set({
            loading: false,
            error: apiResponse ? JSON.stringify(apiResponse) : "Failed to update item",
          });
          throw error;
        } finally {
          window.removeEventListener("beforeunload", onBeforeUnload);
        }
      },

      deleteItem: async (itemId) => {
        set({ loading: true, error: null });

        try {
          await courseService.deleteItem(itemId);
          set({ loading: false });
        } catch (error) {
          const apiResponse = error.response?.data;
          set({
            loading: false,
            error: apiResponse
              ? JSON.stringify(apiResponse)
              : "Failed to delete item",
          });
          throw error;
        }
      },
    }),
    {
      name: "course-store",
      partialize: (state) => ({
        lastViewedItem: state.lastViewedItem,
        courseDraft: state.courseDraft,
      }),
    },
  ),
);
