export function formatBatchLabel(batchLike, fallback = "-") {
  if (!batchLike) return fallback;
  const courseName = batchLike.course_name || batchLike.course?.name || "";
  const batchName =
    batchLike.batch_name || batchLike.class_name || batchLike.name || "";

  if (courseName && batchName) return `${courseName} / ${batchName}`;
  return batchName || courseName || fallback;
}
