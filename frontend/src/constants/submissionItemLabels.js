export const SUBMISSION_ITEM_TYPES = [
  "TEXT_SUMMARY",
  "COMPLETED_TASKS",
  "BLOCKERS",
  "NEXT_PLAN",
  "GITHUB_REPOSITORY",
  "GITHUB_PULL_REQUEST",
  "JIRA_BOARD",
  "FIGMA",
  "DEMO_VIDEO",
  "OTHER_URL",
  "REPORT_FILE",
];

const ITEMS = {
  TEXT_SUMMARY: [
    "Nội dung đã thực hiện",
    "Tóm tắt những nội dung nhóm đã thực hiện trong tuần.",
    "report",
  ],
  COMPLETED_TASKS: [
    "Công việc đã hoàn thành",
    "Liệt kê các công việc đã hoàn thành.",
    "report",
  ],
  BLOCKERS: [
    "Khó khăn, vướng mắc",
    "Mô tả các khó khăn hoặc vấn đề đang gặp.",
    "report",
  ],
  NEXT_PLAN: [
    "Kế hoạch tuần tiếp theo",
    "Nêu kế hoạch thực hiện trong tuần tiếp theo.",
    "report",
  ],
  GITHUB_REPOSITORY: [
    "Kho mã nguồn GitHub",
    "Liên kết tới kho mã nguồn của nhóm.",
    "link",
  ],
  GITHUB_PULL_REQUEST: [
    "GitHub Pull Request",
    "Liên kết Pull Request cần Giảng viên xem xét.",
    "link",
  ],
  JIRA_BOARD: [
    "Bảng công việc Jira",
    "Liên kết tới bảng công việc hoặc sprint.",
    "link",
  ],
  FIGMA: ["Thiết kế Figma", "Liên kết tới bản thiết kế giao diện.", "link"],
  DEMO_VIDEO: ["Video demo", "Liên kết tới video trình diễn sản phẩm.", "link"],
  OTHER_URL: ["Liên kết khác", "Liên kết bổ sung khác.", "link"],
  REPORT_FILE: ["Tệp báo cáo", "Tải lên tệp báo cáo theo yêu cầu.", "file"],
};

export const SUBMISSION_ITEM_GROUPS = [
  { key: "report", title: "Nội dung báo cáo" },
  { key: "link", title: "Liên kết dự án" },
  { key: "file", title: "Tệp đính kèm" },
];

export function getSubmissionItemLabel(type) {
  return ITEMS[type]?.[0] || "N?i dung kh?c";
}

export function getSubmissionItemDescription(type) {
  return ITEMS[type]?.[1] || "";
}

export function getSubmissionItemGroup(type) {
  return ITEMS[type]?.[2] || "report";
}
