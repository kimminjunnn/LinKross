import type { Metadata } from "next";

import { BackendDeck } from "./backend-deck";

export const metadata: Metadata = {
  title: "백엔드 바이브코딩 입문",
  description:
    "팀원들이 LinKross의 백엔드 흐름을 이해하고 AI에게 정확한 구현 요청을 작성하도록 돕는 HTML 발표 자료",
};

export default function BackendVibePresentationPage() {
  return <BackendDeck />;
}
