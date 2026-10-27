// Sample data used until the backend endpoints exist.
// Later steps replace these with real API calls (documents list, chat history).

export const mockChats = [
  { id: 1, title: "Waiting period for pre-existing conditions" },
  { id: 2, title: "Is maternity covered under my floater?" },
  { id: 3, title: "Casual leave carry-forward rules" },
  { id: 4, title: "Term plan: what voids a claim?" },
  { id: 5, title: "Zero depreciation add-on, is it worth it?" },
  { id: 6, title: "Notice period buy-out clause" },
];

export const mockDocuments = [
  { id: 1, name: "Optima Restore Health Policy.pdf", category: "health", status: "ready", pages: 42, size: "3.1 MB", date: "12 Oct 2026", note: "Individual health cover with sum insured, room-rent limits, a waiting-period schedule and a list of exclusions." },
  { id: 2, name: "Group Term Life Certificate.pdf", category: "term", status: "ready", pages: 18, size: "1.2 MB", date: "8 Oct 2026", note: "Term life certificate covering the benefit amount, nominee rules and claim exclusions." },
  { id: 3, name: "Employee Handbook 2026.pdf", category: "hr", status: "ready", pages: 64, size: "5.4 MB", date: "2 Oct 2026", note: "Leave, notice period, reimbursement and conduct policies for employees." },
  { id: 4, name: "Whole Life Plan Brochure.pdf", category: "life", status: "ready", pages: 24, size: "2.2 MB", date: "28 Sep 2026", note: "Whole life plan benefits, premium payment terms and surrender conditions." },
  { id: 5, name: "Car Insurance Schedule.pdf", category: "car", status: "processing", pages: null, size: "0.9 MB", date: "21 Oct 2026", note: "PolicyPal is reading this document. This usually takes under a minute." },
  { id: 6, name: "Family Floater Renewal.pdf", category: "health", status: "failed", pages: null, size: "4.8 MB", date: "15 Oct 2026", note: "We could not read any text in this file. It may be a scanned image. Try uploading a text-based PDF." },
];

export const categories = [
  { key: "all", label: "All" },
  { key: "health", label: "Health" },
  { key: "life", label: "Life" },
  { key: "term", label: "Term" },
  { key: "car", label: "Car" },
  { key: "hr", label: "HR" },
  { key: "other", label: "Other" },
];

export const categoryLabel = Object.fromEntries(categories.map((c) => [c.key, c.label]));

export const statusLabel = { uploaded: "Uploaded", ready: "Ready", processing: "Processing", failed: "Failed" };
export const noteLabel = { uploaded: "Status", ready: "Summary", processing: "Status", failed: "What went wrong" };

export const suggestions = [
  "What is my waiting period for pre-existing conditions?",
  "What is not covered under this policy?",
  "How many leaves can I carry forward?",
  "Summarise the claim process step by step",
];
