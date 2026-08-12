import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/talent-assessment/create",
        destination: "/company/assessments/create",
        permanent: false,
      },
      {
        source: "/talent-assessment/submission-complete",
        destination: "/freelancer/applications/submission-complete",
        permanent: false,
      },
      {
        source: "/talent-assessment/:assessmentId/respond",
        destination: "/freelancer/applications/:assessmentId",
        permanent: false,
      },
      {
        source: "/talent-assessment/:assessmentId/candidates/:candidateId",
        destination:
          "/company/assessments/:assessmentId/candidates/:candidateId",
        permanent: false,
      },
      {
        source: "/talent-assessment/:assessmentId/candidates",
        destination: "/company/assessments/:assessmentId/candidates",
        permanent: false,
      },
      {
        source: "/talent-assessment/:assessmentId",
        destination: "/company/assessments/:assessmentId/setup",
        permanent: false,
      },
      {
        source: "/projects/:path*",
        destination: "/company/projects/:path*",
        permanent: false,
      },
      {
        source: "/assessments/:path*",
        destination: "/company/assessments/:path*",
        permanent: false,
      },
      {
        source: "/settings",
        destination: "/company/settings",
        permanent: false,
      },
      {
        source: "/sow",
        destination: "/company/sow",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
