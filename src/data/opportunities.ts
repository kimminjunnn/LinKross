export type Opportunity = {
  id: string;
  title: string;
  summary: string;
  organization: string;
  budget: string;
  duration: string;
  deadline: string;
  skills: readonly string[];
  requirements: readonly string[];
  support: readonly string[];
};

export const OPPORTUNITIES: readonly Opportunity[] = [
  {
    id: "customer-portal-mvp",
    title: "Customer portal MVP",
    summary:
      "Build a secure customer portal with email sign-in, account access, and a small operations dashboard.",
    organization: "Crosslab",
    budget: "$12,000",
    duration: "8–10 weeks",
    deadline: "Aug 31, 2026",
    skills: ["Next.js", "Node.js", "PostgreSQL", "Playwright"],
    requirements: [
      "Customers can sign in with an email address and password.",
      "A successful sign-in redirects the user to /dashboard.",
      "Invalid credentials and missing required fields show clear errors.",
      "The delivery must be connected to a GitHub PR and immutable commit SHA.",
    ],
    support: [
      "Product requirements and acceptance criteria",
      "Test accounts and synthetic data",
      "A decision maker available for scope questions",
    ],
  },
];

export function getOpportunity(opportunityId: string) {
  const canonicalId =
    opportunityId === "ast_sample_01" ? "customer-portal-mvp" : opportunityId;
  return OPPORTUNITIES.find((opportunity) => opportunity.id === canonicalId);
}
