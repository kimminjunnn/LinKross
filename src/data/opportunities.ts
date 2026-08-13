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
  {
    id: "e-commerce-checkout",
    title: "E-commerce Checkout & Inventory Sync",
    summary:
      "Build a highly responsive checkout funnel with Stripe payment integration, real-time stock checks, and inventory status sync.",
    organization: "ShopVibe",
    budget: "$18,000",
    duration: "10–12 weeks",
    deadline: "Sep 15, 2026",
    skills: ["Next.js", "Node.js", "PostgreSQL", "Playwright", "Stripe"],
    requirements: [
      "Customers can adjust product quantities in cart with real-time total updates.",
      "Stripe payment gateway completes transaction securely using webhook events.",
      "Inventory is locked during checkout sequence to prevent overselling of high-demand items.",
      "Orders table successfully updates status to 'paid' and triggers email payload logs.",
    ],
    support: [
      "Sandbox Stripe keys and mock product metadata configurations",
      "Staged inventory backend endpoints",
      "Client dev team lead available for joint review sessions",
    ],
  },
  {
    id: "saas-analytics-dashboard",
    title: "B2B SaaS Analytics Dashboard",
    summary:
      "Implement a real-time analytics dashboard with interactive data visualization charts, role-based workspace permissions, and CSV export capabilities.",
    organization: "MetricFlow",
    budget: "$15,000",
    duration: "8–10 weeks",
    deadline: "Sep 10, 2026",
    skills: ["Next.js", "TypeScript", "PostgreSQL", "Playwright"],
    requirements: [
      "Workspaces support distinct Admin and Viewer role profiles with strict API access controls.",
      "Responsive analytics charts correctly render daily/monthly usage statistics using aggregated database views.",
      "CSV export functionality allows downloading the filtered dataset with correct UTF-8 formatting.",
      "Automated verification runner asserts page access permissions and chart viewport loading.",
    ],
    support: [
      "High-fidelity Figma UI design layouts for desktop & mobile viewports",
      "Mock analytics logs generator script for testing",
      "Direct Slack channel access for rapid Q&A communication",
    ],
  },
];

export function getOpportunity(opportunityId: string) {
  const canonicalId =
    opportunityId === "ast_sample_01" ? "customer-portal-mvp" : opportunityId;
  return OPPORTUNITIES.find((opportunity) => opportunity.id === canonicalId);
}
