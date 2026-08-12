import type { ReactNode } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircleX,
  ClipboardCheck,
  Code2,
  Database,
  Eye,
  FileArchive,
  KeyRound,
  LockKeyhole,
  MessageSquareText,
  MonitorSmartphone,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  Send,
  Server,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";

import styles from "./backend-deck.module.css";

export type DeckSlide = {
  id: string;
  section: string;
  label: string;
  title: string;
  body: ReactNode;
  notes: ReactNode;
  variant?: "cover" | "section" | "default" | "image" | "prompt";
};

const ASSET_ROOT = "/presentation/backend-vibe/assets";

type AssetImageProps = {
  src: string;
  alt: string;
  contain?: boolean;
  sizes?: string;
  className?: string;
};

function AssetImage({
  src,
  alt,
  contain = false,
  sizes = "50vw",
  className,
}: AssetImageProps) {
  return (
    <div className={[styles.imageFrame, className].filter(Boolean).join(" ")}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading="eager"
        className={contain ? styles.imageContain : styles.imageCover}
      />
    </div>
  );
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Image
      src={
        compact
          ? "/brand/linkross-symbol-on-light.svg"
          : "/brand/linkross-lockup-on-light.svg"
      }
      alt="LinKross"
      width={compact ? 64 : 196}
      height={compact ? 64 : 48}
      loading="eager"
      className={compact ? styles.brandSymbol : styles.brandLogo}
    />
  );
}

function TechLogo({
  name,
  file,
}: {
  name: string;
  file: string;
}) {
  return (
    <div className={styles.logoItem}>
      <Image
        src={`${ASSET_ROOT}/logos/${file}.svg`}
        alt={`${name} 로고`}
        width={72}
        height={72}
        loading="eager"
        className={styles.techLogo}
      />
      <span>{name}</span>
    </div>
  );
}

function FlowArrow({ down = false }: { down?: boolean }) {
  const Icon = down ? ArrowDown : ArrowRight;
  return <Icon aria-hidden="true" className={styles.flowArrow} />;
}

function FlowNode({
  icon,
  title,
  detail,
  accent = false,
}: {
  icon: ReactNode;
  title: string;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <div className={`${styles.flowNode} ${accent ? styles.flowNodeAccent : ""}`}>
      <span className={styles.flowNodeIcon}>{icon}</span>
      <strong>{title}</strong>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}

function QuestionNumber({ number, children }: { number: string; children: ReactNode }) {
  return (
    <div className={styles.questionItem}>
      <span>{number}</span>
      <div>{children}</div>
    </div>
  );
}

export const slides = [
  {
    id: "slide-01",
    section: "시작",
    label: "BACKEND VIBE CODING",
    title: "화면 뒤에서는 무슨 일이 일어날까?",
    variant: "cover",
    body: (
      <div className={styles.coverBody}>
        <p className={styles.coverKicker}>LinKross 팀을 위한 백엔드 입문</p>
        <h1 className={styles.coverTitle}>화면 뒤에서는 무슨 일이 일어날까?</h1>
        <div className={styles.coverFlow} aria-label="화면에서 데이터베이스까지 이어지는 흐름">
          <MonitorSmartphone aria-hidden="true" />
          <ArrowRight aria-hidden="true" />
          <Server aria-hidden="true" />
          <ArrowRight aria-hidden="true" />
          <Database aria-hidden="true" />
        </div>
        <div className={styles.coverBrand}>
          <BrandLogo />
          <span>김민준 · 2026</span>
        </div>
      </div>
    ),
    notes:
      "안녕하세요. 여러분의 백엔드 이해를 돕기 위해 오늘 일일 강사가 된 김민준입니다. 재밌게 들어주시고, 오늘 이야기가 LinKross의 백엔드 바이브코딩에 조금이라도 도움이 되었으면 좋겠습니다.",
  },
  {
    id: "slide-02",
    section: "시작",
    label: "TODAY'S GOAL",
    title: "목표는 코드를 외우는 것이 아닙니다",
    variant: "default",
    body: (
      <div className={styles.goalContrast}>
        <div className={styles.goalWrong}>
          <CircleX aria-hidden="true" />
          <span>모든 문법과 코드를 외우기</span>
        </div>
        <ArrowRight aria-hidden="true" className={styles.goalArrow} />
        <div className={styles.goalRight}>
          <BrainCircuit aria-hidden="true" />
          <strong>AI에게 무슨 일을 시킬지 설명하기</strong>
        </div>
      </div>
    ),
    notes:
      "오늘은 백엔드 개발자가 되기 위한 문법 수업이 아닙니다. 백엔드에서 어떤 일이 일어나는지 이해하고, 그 동작을 AI에게 구체적으로 설명하는 감각을 만드는 시간입니다.",
  },
  {
    id: "slide-03",
    section: "소개",
    label: "2024 · THE FIRST STEP",
    title: "2024년 1월, 프론트엔드로 개발을 시작했습니다",
    variant: "image",
    body: (
      <div className={styles.profileStory}>
        <AssetImage
          src={`${ASSET_ROOT}/presenter.png`}
          alt="발표자 김민준"
          sizes="32vw"
          className={styles.presenterFrame}
        />
        <div className={styles.profileCopy}>
          <p className={styles.storyLead}>고려대학교 컴퓨터 동아리 KUCC</p>
          <div className={styles.storyMilestone}>
            <Code2 aria-hidden="true" />
            <div>
              <strong>15인 프로젝트 · ASKu</strong>
              <span>교내 정보를 제공하는 나무위키형 서비스 · 프론트엔드 개발 참여</span>
            </div>
          </div>
          <AssetImage
            src={`${ASSET_ROOT}/asku.png`}
            alt="KUCC 프로젝트 ASKu GitHub 저장소"
            contain
            sizes="42vw"
            className={styles.embeddedScreenshot}
          />
        </div>
      </div>
    ),
    notes:
      "혹시 '누군데 백엔드를 가르치지?'라는 생각이 들 수 있어 제 경험을 짧게 말씀드리겠습니다. 2024년 1월 프론트엔드로 개발을 시작했습니다. 이후 고려대학교 컴퓨터 동아리 KUCC에서 15명이 함께 만든 교내 정보 제공 나무위키형 서비스 ASKu의 프론트엔드 개발에 참여했습니다.",
  },
  {
    id: "slide-04",
    section: "소개",
    label: "BUILD · WRITE · REPEAT",
    title: "만들기만큼, 기록하는 일도 계속했습니다",
    variant: "image",
    body: (
      <div className={styles.evidenceLayout}>
        <div className={styles.contributionStack}>
          <AssetImage
            src={`${ASSET_ROOT}/github-2024.png`}
            alt="2024년 GitHub 기여 기록"
            contain
            sizes="48vw"
            className={styles.contributionImage}
          />
          <AssetImage
            src={`${ASSET_ROOT}/github-2025.png`}
            alt="2025년 GitHub 기여 기록"
            contain
            sizes="48vw"
            className={styles.contributionImage}
          />
          <AssetImage
            src={`${ASSET_ROOT}/github-2026.png`}
            alt="2026년 GitHub 기여 기록"
            contain
            sizes="48vw"
            className={styles.contributionImage}
          />
        </div>
        <div className={styles.velogEvidence}>
          <AssetImage
            src={`${ASSET_ROOT}/velog.png`}
            alt="Velog 개발 기록 화면"
            contain
            sizes="34vw"
            className={styles.velogFrame}
          />
          <div className={styles.metricRow}>
            <div className={styles.metricItem}>
              <strong>456</strong>
              <span>개발 관련 글</span>
            </div>
            <div className={styles.metricItem}>
              <strong>13,294</strong>
              <span>누적 조회</span>
            </div>
          </div>
        </div>
      </div>
    ),
    notes:
      "결과만 만든 것이 아니라 배운 내용을 계속 기록했습니다. GitHub 기여를 쌓았고, Velog에는 개발 관련 글 456개를 남겨 총 13,294회의 조회를 기록했습니다. 숫자를 자랑하려는 것이 아니라, 모르는 것을 반복해서 이해해 온 사람이라는 정도로 봐주시면 됩니다.",
  },
  {
    id: "slide-05",
    section: "소개",
    label: "FROM PRACTICE TO PRODUCT",
    title: "직접 만들고, 외주하고, 배포해봤습니다",
    variant: "image",
    body: (
      <div className={styles.projectShowcase}>
        <div className={styles.projectWideColumn}>
          <figure className={styles.projectFigure}>
            <AssetImage
              src={`${ASSET_ROOT}/freelance-web.png`}
              alt="프리랜서 외주로 개발한 회사 웹페이지"
              contain
              sizes="42vw"
              className={styles.projectWideImage}
            />
            <figcaption>회사 웹페이지 프론트엔드 외주</figcaption>
          </figure>
          <figure className={styles.projectFigure}>
            <AssetImage
              src={`${ASSET_ROOT}/zapsheet.png`}
              alt="아버지의 업무를 위해 만든 웹 기반 엑셀 ZapSheet"
              contain
              sizes="42vw"
              className={styles.projectWideImage}
            />
            <figcaption>업무용 웹 엑셀 · ZapSheet</figcaption>
          </figure>
        </div>
        <div className={styles.projectPosterColumn}>
          <figure className={styles.projectFigure}>
            <AssetImage
              src={`${ASSET_ROOT}/rupa.png`}
              alt="개인 클라이밍 앱 Rupa"
              sizes="17vw"
              className={styles.projectPosterImage}
            />
            <figcaption>개인 클라이밍 앱 · Rupa</figcaption>
          </figure>
          <figure className={styles.projectFigure}>
            <AssetImage
              src={`${ASSET_ROOT}/spot.png`}
              alt="5인 팀으로 개발 중인 앱 SPOT"
              sizes="17vw"
              className={styles.projectPosterImage}
            />
            <figcaption>5인 팀 앱 개발 · SPOT</figcaption>
          </figure>
        </div>
      </div>
    ),
    notes:
      "2025년에는 실제 회사와 계약하고 웹페이지 프론트엔드 외주를 맡았습니다. 2026년에는 아버지께서 업무에 쓰실 웹 기반 엑셀과 개인 클라이밍 앱을 직접 만들고 배포했고, 지금은 5인 팀으로 앱도 개발하고 있습니다. 개발을 아예 처음 해본 사람은 아니라는 배경만 기억해 주세요.",
  },
  {
    id: "slide-06",
    section: "백엔드의 역할",
    label: "CHAPTER 01",
    title: "자, 그래서 백엔드가 무엇이냐!",
    variant: "section",
    body: (
      <div className={styles.sectionStatement}>
        <Server aria-hidden="true" />
        <p>사용자에게 보이지 않는 곳에서<br />서비스를 실제로 움직이는 일</p>
      </div>
    ),
    notes:
      "이제 본론으로 가보겠습니다. 백엔드를 바로 정의하기보다, 우리가 익숙하게 작업해 온 프론트엔드부터 짚고 둘의 차이를 연결해 보겠습니다.",
  },
  {
    id: "slide-07",
    section: "백엔드의 역할",
    label: "FRONTEND",
    title: "프론트엔드는 사용자가 보고, 누르는 화면입니다",
    body: (
      <div className={styles.frontendDefinition}>
        <div className={styles.actionWord}><Eye aria-hidden="true" /><span>보고</span></div>
        <div className={styles.actionWord}><PencilLine aria-hidden="true" /><span>누르고</span></div>
        <div className={styles.actionWord}><RefreshCw aria-hidden="true" /><span>반응한다</span></div>
        <div className={styles.languagePair}>
          <TechLogo name="JavaScript" file="javascript" />
          <ArrowRight aria-hidden="true" />
          <TechLogo name="TypeScript" file="typescript" />
          <p>JavaScript에 <strong>타입이라는 안전장치</strong>를 더한 언어</p>
        </div>
      </div>
    ),
    notes:
      "프론트엔드는 사용자가 실제로 보고, 누르고, 상호작용하는 화면을 구현하는 영역입니다. 웹에서는 JavaScript가 중심이고, 우리는 여기에 '문자열인지 숫자인지' 같은 타입 안전장치를 더한 TypeScript로 화면을 만들어 왔습니다.",
  },
  {
    id: "slide-08",
    section: "백엔드의 역할",
    label: "THE MISSING HALF",
    title: "예쁜 화면만으로는 서비스가 움직이지 않습니다",
    variant: "image",
    body: (
      <div className={styles.setStageLayout}>
        <AssetImage
          src={`${ASSET_ROOT}/frontend-set.png`}
          alt="주방 없이 홀만 있는 레스토랑 세트장"
          sizes="58vw"
          className={styles.setStageImage}
        />
        <div className={styles.deadButtonMoment}>
          <span>이름 · 이메일 · 비밀번호</span>
          <button type="button" tabIndex={-1}>회원가입</button>
          <div className={styles.silenceLine}>클릭 → <strong>아무 일도 없음</strong></div>
        </div>
      </div>
    ),
    notes:
      "회원가입 화면을 아주 예쁘게 만들었다고 해보겠습니다. 이름, 이메일, 비밀번호 입력창과 버튼까지 있지만 누르면 아무 일도 일어나지 않습니다. 입력한 정보를 검증하고 어딘가에 저장해 줄 시스템이 아직 없기 때문입니다.",
  },
  {
    id: "slide-09",
    section: "백엔드의 역할",
    label: "RESTAURANT MODEL",
    title: "백엔드는 손님에게 보이지 않는 주방입니다",
    variant: "image",
    body: (
      <div className={styles.restaurantLayout}>
        <AssetImage
          src={`${ASSET_ROOT}/restaurant-system.png`}
          alt="프론트엔드, API, 백엔드, 데이터베이스를 레스토랑에 비유한 그림"
          sizes="64vw"
          className={styles.restaurantImage}
        />
        <div className={styles.restaurantLegend}>
          <span><MonitorSmartphone aria-hidden="true" /><strong>홀·메뉴판</strong> 프론트엔드</span>
          <span><UtensilsCrossed aria-hidden="true" /><strong>주방</strong> 백엔드</span>
          <span><Database aria-hidden="true" /><strong>냉장고·창고</strong> DB</span>
        </div>
      </div>
    ),
    notes:
      "레스토랑에 비유하면 프론트엔드는 손님이 보는 홀과 메뉴판입니다. 백엔드는 주문을 받아 재료를 가져오고 음식을 만들어 결과를 돌려주는 주방입니다. 주방 한쪽의 냉장고나 창고가 데이터를 보관하는 데이터베이스입니다.",
  },
  {
    id: "slide-10",
    section: "백엔드의 역할",
    label: "LOGIN EXAMPLE",
    title: "로그인은 요청이 갔다가, 결과가 돌아오는 왕복 과정입니다",
    body: (
      <div className={styles.loginJourney}>
        <div className={styles.loginRequestRow}>
          <FlowNode
            icon={<MonitorSmartphone aria-hidden="true" />}
            title="① 프론트엔드"
            detail="이메일·비밀번호 전송"
          />
          <FlowArrow />
          <FlowNode
            icon={<KeyRound aria-hidden="true" />}
            title="② 백엔드"
            detail="로그인 요청·입력값 확인"
            accent
          />
          <FlowArrow />
          <FlowNode
            icon={<Database aria-hidden="true" />}
            title="③ 데이터베이스"
            detail="이메일로 사용자 찾기"
          />
        </div>
        <div className={styles.loginTurn}>
          <span>찾은 사용자 정보</span>
          <ArrowDown aria-hidden="true" />
        </div>
        <div className={styles.loginResponseRow}>
          <FlowNode
            icon={<CheckCircle2 aria-hidden="true" />}
            title="⑤ 프론트엔드"
            detail="성공: 로그인 · 실패: 오류 안내"
          />
          <ArrowLeft aria-hidden="true" className={styles.loginBackArrow} />
          <FlowNode
            icon={<ShieldCheck aria-hidden="true" />}
            title="④ 백엔드"
            detail="비밀번호 일치 여부 검증"
            accent
          />
        </div>
      </div>
    ),
    notes:
      "로그인은 한 방향으로 끝나는 일이 아니라 요청과 결과가 왕복하는 과정입니다. 프론트엔드가 이메일과 비밀번호를 보내면 백엔드는 입력값을 확인하고, DB에서 이메일에 해당하는 사용자를 찾습니다. 그다음 저장된 비밀번호 정보와 일치하는지 검증해 성공 또는 실패 결과를 프론트엔드에 돌려줍니다. 실제 서비스는 비밀번호 원문을 그대로 저장하지 않고 안전하게 변환된 값으로 비교합니다.\n\n[Sources]\nhttps://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
  },
  {
    id: "slide-11",
    section: "백엔드의 역할",
    label: "API",
    title: "API는 홀과 주방 사이의 주문 통로입니다",
    body: (
      <div className={styles.apiMetaphor}>
        <div className={styles.apiSpeaker}>
          <MonitorSmartphone aria-hidden="true" />
          <p>“로그인해줘.”<br />“이 글을 저장해줘.”</p>
        </div>
        <div className={styles.apiChannel}>
          <MessageSquareText aria-hidden="true" />
          <strong>API</strong>
          <span>정해진 방식으로 요청 전달</span>
        </div>
        <div className={styles.apiSpeaker}>
          <Server aria-hidden="true" />
          <p>요청을 확인하고<br />결과를 돌려준다</p>
        </div>
      </div>
    ),
    notes:
      "손님이 주방에 직접 들어가 냉장고를 뒤지면 안 되겠죠. 주문을 정해진 방식으로 전달하는 통로가 필요합니다. 프론트엔드와 백엔드 사이에서 그 역할을 하는 것이 API입니다.",
  },
  {
    id: "slide-12",
    section: "백엔드의 역할",
    label: "ROUND TRIP",
    title: "요청은 안으로, 결과는 다시 화면으로 돌아옵니다",
    body: (
      <div className={styles.roundTrip}>
        <div className={styles.roundTripTrack}>
          <span className={styles.trackLabel}>요청</span>
          <FlowNode icon={<MonitorSmartphone aria-hidden="true" />} title="프론트" />
          <FlowArrow />
          <FlowNode icon={<MessageSquareText aria-hidden="true" />} title="API" />
          <FlowArrow />
          <FlowNode icon={<Server aria-hidden="true" />} title="백엔드" accent />
          <FlowArrow />
          <FlowNode icon={<Database aria-hidden="true" />} title="DB" />
        </div>
        <div className={`${styles.roundTripTrack} ${styles.returnTrack}`}>
          <span className={styles.trackLabel}>결과</span>
          <FlowNode icon={<MonitorSmartphone aria-hidden="true" />} title="프론트" />
          <FlowArrow />
          <FlowNode icon={<MessageSquareText aria-hidden="true" />} title="API" />
          <FlowArrow />
          <FlowNode icon={<Server aria-hidden="true" />} title="백엔드" accent />
          <FlowArrow />
          <FlowNode icon={<Database aria-hidden="true" />} title="DB" />
        </div>
      </div>
    ),
    notes:
      "웹서비스를 아주 단순하게 보면 프론트엔드에서 API를 거쳐 백엔드와 DB로 요청이 들어갑니다. 처리 결과는 반대 방향으로 다시 프론트엔드까지 돌아옵니다. 이 왕복 흐름이 오늘 이야기 전체의 뼈대입니다.",
  },
  {
    id: "slide-13",
    section: "백엔드의 역할",
    label: "LANGUAGE ≠ ROLE",
    title: "같은 백엔드 역할도 여러 언어와 도구로 만들 수 있습니다",
    body: (
      <div className={styles.languageLandscape}>
        <div className={styles.languageToolMap}>
          <div className={styles.languageToolRow}>
            <TechLogo name="TypeScript / JavaScript" file="typescript" />
            <ArrowRight aria-hidden="true" />
            <p><strong>Node.js</strong><span>Express · NestJS</span></p>
          </div>
          <div className={styles.languageToolRow}>
            <TechLogo name="Python" file="python" />
            <ArrowRight aria-hidden="true" />
            <p><strong>FastAPI · Django</strong><span>Python 서버 프레임워크</span></p>
          </div>
          <div className={styles.languageToolRow}>
            <TechLogo name="Java" file="java" />
            <ArrowRight aria-hidden="true" />
            <p><strong>Spring Boot</strong><span>Java 서버 프레임워크</span></p>
          </div>
          <div className={styles.languageToolRow}>
            <TechLogo name="Go" file="go" />
            <ArrowRight aria-hidden="true" />
            <p><strong>Gin · Fiber</strong><span>Go 웹 프레임워크</span></p>
          </div>
          <div className={styles.languageToolRow}>
            <TechLogo name="C#" file="dotnet" />
            <ArrowRight aria-hidden="true" />
            <p><strong>.NET · ASP.NET Core</strong><span>C# 서버 플랫폼·프레임워크</span></p>
          </div>
        </div>
        <div className={styles.languageConclusion}>
          <strong>언어와 도구는 달라도</strong>
          <span>요청 처리 · DB 연동 · 결과 반환이라는 역할은 같습니다.</span>
        </div>
      </div>
    ),
    notes:
      "백엔드라는 전용 언어가 따로 있는 것은 아닙니다. TypeScript나 JavaScript는 Node.js 환경에서 Express 또는 NestJS를 사용할 수 있고, Python은 FastAPI나 Django, Java는 Spring Boot, Go는 Gin이나 Fiber, C#은 .NET과 ASP.NET Core를 사용할 수 있습니다. 정확히는 Node.js와 .NET은 실행 환경 또는 플랫폼이고 나머지는 서버 개발을 돕는 프레임워크입니다. 이름은 달라도 요청을 받고 DB와 이야기해 결과를 돌려주는 역할은 같습니다.\n\n[Sources]\nhttps://nodejs.org/en/about\nhttps://expressjs.com/\nhttps://docs.nestjs.com/\nhttps://fastapi.tiangolo.com/\nhttps://www.djangoproject.com/\nhttps://spring.io/projects/spring-boot/\nhttps://gin-gonic.com/\nhttps://docs.gofiber.io/\nhttps://dotnet.microsoft.com/en-us/apps/aspnet",
  },
  {
    id: "slide-14",
    section: "백엔드의 역할",
    label: "VIBE CODING",
    title: "코드 이름보다, 일어나야 할 동작을 설명하세요",
    body: (
      <div className={styles.promptContrast}>
        <div className={styles.vaguePrompt}>
          <Code2 aria-hidden="true" />
          <span>“백엔드 만들어줘.”</span>
        </div>
        <ArrowRight aria-hidden="true" className={styles.promptArrow} />
        <div className={styles.specificPrompt}>
          <MessageSquareText aria-hidden="true" />
          <p>“회원가입 요청을 검증하고,<br />DB에 저장한 뒤 성공 여부를 반환해줘.”</p>
        </div>
      </div>
    ),
    notes:
      "바이브코딩에서는 프레임워크 이름을 많이 아는 것보다 어떤 일이 일어나야 하는지 정확히 설명하는 것이 중요합니다. '백엔드 만들어줘'보다 검증, 저장, 반환의 순서를 말할 수 있는 사람이 AI를 훨씬 잘 사용합니다.",
  },
  {
    id: "slide-15",
    section: "DB · API · CRUD",
    label: "DATABASE",
    title: "DB는 새로고침 뒤에도 서비스를 기억하게 합니다",
    body: (
      <div className={styles.memoryScene}>
        <div className={styles.memoryBefore}>
          <Save aria-hidden="true" />
          <span>“발표 자료 만들기” 저장</span>
        </div>
        <RefreshCw aria-hidden="true" className={styles.refreshIcon} />
        <div className={styles.memoryAfter}>
          <Database aria-hidden="true" />
          <strong>다시 로그인해도 그대로</strong>
        </div>
      </div>
    ),
    notes:
      "화면에 글자가 보인다고 데이터가 저장된 것은 아닙니다. 새로고침하거나 다시 로그인해도 내용이 남으려면 데이터베이스에 저장되어야 합니다. DB는 서비스를 기억하게 만드는 곳입니다.",
  },
  {
    id: "slide-16",
    section: "DB · API · CRUD",
    label: "WHAT TO REMEMBER",
    title: "Todo와 LinKross는 기억해야 할 데이터만 다릅니다",
    body: (
      <div className={styles.dataComparison}>
        <div className={styles.dataColumn}>
          <span className={styles.comparisonEyebrow}>TODO</span>
          <h3>할 일과 완료 상태</h3>
          <ul className={styles.cleanList}>
            <li><Check aria-hidden="true" />발표 자료 만들기 · 미완료</li>
            <li><Check aria-hidden="true" />회의하기 · 완료</li>
          </ul>
        </div>
        <div className={styles.comparisonDivider} />
        <div className={styles.dataColumn}>
          <span className={styles.comparisonEyebrow}>LINKROSS</span>
          <h3>프로젝트와 합의·검수 기록</h3>
          <p className={styles.fieldLine}>프로젝트 이름 · 만든 사람 · 예산 · 일정</p>
          <p className={styles.fieldLine}>수행 제안서 · SOW · 검수 결과</p>
        </div>
      </div>
    ),
    notes:
      "Todo라면 할 일 내용과 완료 여부를 기억합니다. LinKross라면 프로젝트 이름, 만든 사람, 예산과 일정, 모집 상태, 수행 제안서, SOW와 검수 결과를 기억해야 합니다. 서비스가 복잡해져도 '무엇을 기억할지'를 정하는 원리는 같습니다.",
  },
  {
    id: "slide-17",
    section: "DB · API · CRUD",
    label: "API CONVERSATION",
    title: "API는 화면의 ‘저장해줘’를 백엔드에 전달합니다",
    body: (
      <div className={styles.saveConversation}>
        <div className={styles.todoInput}>
          <span>발표 자료 만들기</span>
          <Plus aria-hidden="true" />
        </div>
        <div className={styles.messageSequence}>
          <div><Send aria-hidden="true" />“이 할 일을 저장해줘.”</div>
          <FlowArrow down />
          <div className={styles.backendReply}><Server aria-hidden="true" />내용 확인 → DB 저장</div>
          <FlowArrow down />
          <div><CheckCircle2 aria-hidden="true" />“저장했어.”</div>
        </div>
      </div>
    ),
    notes:
      "사용자가 Todo를 입력하고 추가 버튼을 누르면 프론트엔드는 API를 통해 '이 할 일을 저장해줘'라고 요청합니다. 백엔드는 내용을 확인하고 DB에 저장한 뒤 '저장했어'라는 결과를 돌려줍니다. API는 화면과 백엔드 사이의 대화 방법입니다.",
  },
  {
    id: "slide-18",
    section: "DB · API · CRUD",
    label: "CRUD",
    title: "CRUD는 데이터의 생애주기를 이루는 네 가지 동작입니다",
    body: (
      <div className={styles.crudOverview}>
        <div className={styles.crudStrip}>
          <div className={styles.crudItem}><Plus aria-hidden="true" /><strong>Create</strong><span>새 데이터 만들기</span><em>“새 Todo를 저장해줘”</em></div>
          <div className={styles.crudItem}><Eye aria-hidden="true" /><strong>Read</strong><span>저장된 데이터 찾기</span><em>“내 Todo를 보여줘”</em></div>
          <div className={styles.crudItem}><PencilLine aria-hidden="true" /><strong>Update</strong><span>기존 데이터 바꾸기</span><em>“완료로 바꿔줘”</em></div>
          <div className={styles.crudItem}><Trash2 aria-hidden="true" /><strong>Delete</strong><span>데이터 없애기</span><em>“이 Todo를 삭제해줘”</em></div>
        </div>
        <div className={styles.crudCommonFlow}>
          <strong>모든 CRUD의 공통 흐름</strong>
          <span>버튼 클릭</span><ArrowRight aria-hidden="true" />
          <span>API 요청</span><ArrowRight aria-hidden="true" />
          <span>권한·규칙 확인</span><ArrowRight aria-hidden="true" />
          <span>DB 처리</span><ArrowRight aria-hidden="true" />
          <span>성공·실패 반환</span>
        </div>
      </div>
    ),
    notes:
      "Create, Read, Update, Delete의 앞글자를 따서 CRUD, 크러드라고 부릅니다. 한 데이터가 만들어지고, 조회되고, 바뀌고, 필요하면 사라지는 생애주기입니다. 하지만 실제 백엔드 기능은 DB 작업만 하지 않습니다. 버튼 클릭을 API 요청으로 받고, 권한과 규칙을 확인하고, DB를 처리한 뒤 성공 또는 실패를 돌려줘야 완성됩니다.",
  },
  {
    id: "slide-19",
    section: "Todo로 보는 CRUD",
    label: "CREATE",
    title: "Create — 입력을 확인하고, 만든 사람과 함께 저장합니다",
    body: (
      <div className={styles.crudFlow}>
        <FlowNode icon={<Plus aria-hidden="true" />} title="① 입력" detail="발표 자료 만들기" />
        <FlowArrow />
        <FlowNode icon={<ShieldCheck aria-hidden="true" />} title="② 규칙 확인" detail="로그인 · 빈 값 검사" accent />
        <FlowArrow />
        <FlowNode icon={<Database aria-hidden="true" />} title="③ DB 생성" detail="내용 · 작성자 · 미완료" />
        <FlowArrow />
        <FlowNode icon={<CheckCircle2 aria-hidden="true" />} title="④ 결과 반환" detail="새 Todo 화면 표시" />
      </div>
    ),
    notes:
      "Create는 새 데이터를 만드는 일입니다. 입력값만 저장하는 것이 아니라 로그인했는지, 내용이 비어 있지 않은지 확인합니다. 조건을 통과하면 Todo 내용과 작성자, 기본 완료 상태를 함께 저장하고 생성된 결과를 화면에 돌려줍니다.",
  },
  {
    id: "slide-20",
    section: "Todo로 보는 CRUD",
    label: "READ",
    title: "Read — 지금 이 사용자에게 보여줄 데이터만 찾습니다",
    body: (
      <div className={styles.crudFlow}>
        <FlowNode icon={<Eye aria-hidden="true" />} title="① 목록 요청" detail="내 Todo 보여줘" />
        <FlowArrow />
        <FlowNode icon={<UserCheck aria-hidden="true" />} title="② 조회 조건" detail="작성자=나 · 최신순" accent />
        <FlowArrow />
        <FlowNode icon={<Database aria-hidden="true" />} title="③ DB 검색" detail="조건에 맞는 데이터" />
        <FlowArrow />
        <FlowNode icon={<CheckCircle2 aria-hidden="true" />} title="④ 결과 반환" detail="목록 · 빈 상태 · 오류" />
      </div>
    ),
    notes:
      "Read는 저장된 데이터를 찾는 일입니다. Todo 앱을 열면 백엔드는 아무 Todo나 가져오는 것이 아니라 작성자가 지금 로그인한 사용자인 데이터를 조건에 맞춰 검색합니다. 찾은 목록뿐 아니라 데이터가 없는 빈 상태와 오류도 화면에 돌려줘야 합니다.",
  },
  {
    id: "slide-21",
    section: "Todo로 보는 CRUD",
    label: "UPDATE",
    title: "Update — 권한을 확인한 뒤 필요한 값만 바꿉니다",
    body: (
      <div className={styles.crudFlow}>
        <FlowNode icon={<PencilLine aria-hidden="true" />} title="① 수정 요청" detail="Todo ID · 완료=true" />
        <FlowArrow />
        <FlowNode icon={<UserCheck aria-hidden="true" />} title="② 대상·권한" detail="존재하는가? 내 것인가?" accent />
        <FlowArrow />
        <FlowNode icon={<Database aria-hidden="true" />} title="③ DB 변경" detail="완료 상태만 수정" />
        <FlowArrow />
        <FlowNode icon={<CheckCircle2 aria-hidden="true" />} title="④ 결과 반환" detail="변경된 Todo · 실패 이유" />
      </div>
    ),
    notes:
      "Update는 저장된 값을 바꾸는 일입니다. 백엔드는 Todo ID로 대상을 찾고, 실제로 존재하는지와 로그인한 사용자의 것인지 확인합니다. 권한이 있으면 요청받은 완료 상태만 바꾸고, 내 것이 아니라면 수정하지 않은 채 실패 이유를 돌려줍니다.",
  },
  {
    id: "slide-22",
    section: "Todo로 보는 CRUD",
    label: "DELETE",
    title: "Delete — 권한을 확인한 뒤 데이터를 삭제합니다",
    body: (
      <div className={styles.crudFlow}>
        <FlowNode icon={<Trash2 aria-hidden="true" />} title="① 삭제 요청" detail="삭제할 Todo ID" />
        <FlowArrow />
        <FlowNode icon={<UserCheck aria-hidden="true" />} title="② 대상·권한" detail="존재하는가? 내 것인가?" accent />
        <FlowArrow />
        <FlowNode icon={<Database aria-hidden="true" />} title="③ DB 삭제" detail="해당 Todo 제거" />
        <FlowArrow />
        <FlowNode icon={<CircleX aria-hidden="true" />} title="④ 결과 반환" detail="화면 갱신 · 실패 안내" />
      </div>
    ),
    notes:
      "Delete도 버튼 한 번으로 끝나지 않습니다. Todo ID로 대상을 찾고, 존재 여부와 소유 권한을 확인한 뒤 DB에서 삭제합니다. 이미 없으면 없다고 안내하고, 권한이 없으면 삭제를 거절하며, 성공하면 화면에서 해당 Todo를 없앱니다.",
  },
  {
    id: "slide-23",
    section: "LinKross로 확장하기",
    label: "CHAPTER 03",
    title: "CRUD는 같지만, LinKross는 지켜야 할 규칙이 더 많습니다",
    variant: "section",
    body: (
      <div className={styles.complexityBridge}>
        <div className={styles.simpleSide}><ClipboardCheck aria-hidden="true" /><strong>Todo</strong><span>내 할 일 하나</span></div>
        <ArrowRight aria-hidden="true" />
        <div className={styles.complexSide}>
          <BrandLogo compact />
          <strong>LinKross</strong>
          <span>역할 · 상태 · 승인 · 이력</span>
        </div>
      </div>
    ),
    notes:
      "이제 같은 CRUD를 LinKross 프로젝트에 적용해 보겠습니다. 원리는 같지만 발주자와 지원자처럼 역할이 있고, 모집과 승인처럼 상태가 있으며, 중요한 원문과 이력을 보존해야 하므로 규칙이 더 많아집니다.",
  },
  {
    id: "slide-24",
    section: "LinKross로 확장하기",
    label: "CREATE PROJECT",
    title: "Create — 프로젝트 저장 전, 자격과 필수값을 확인합니다",
    body: (
      <div className={styles.projectCreateFlow}>
        <FlowNode icon={<UserRound aria-hidden="true" />} title="로그인" />
        <FlowArrow />
        <FlowNode icon={<BriefcaseBusiness aria-hidden="true" />} title="발주자 역할" accent />
        <FlowArrow />
        <FlowNode icon={<ClipboardCheck aria-hidden="true" />} title="필수 내용" detail="이름·목표·기간" />
        <FlowArrow />
        <FlowNode icon={<Database aria-hidden="true" />} title="프로젝트 저장" />
        <FlowArrow />
        <FlowNode icon={<ArrowRight aria-hidden="true" />} title="상세로 이동" />
      </div>
    ),
    notes:
      "발주자가 이름, 목표, 요구사항, 예산, 일정과 모집 기간을 입력하고 등록합니다. 백엔드는 로그인 여부, 발주자 역할, 필수값과 날짜 규칙을 확인한 뒤 저장합니다. 단순 저장이 아니라 누가 어떤 조건으로 만들 수 있는지를 함께 판단합니다.",
  },
  {
    id: "slide-25",
    section: "LinKross로 확장하기",
    label: "READ BY ROLE",
    title: "Read — 같은 프로젝트도 역할에 따라 보이는 정보가 다릅니다",
    body: (
      <div className={styles.roleVisibility}>
        <div className={styles.roleColumn}>
          <BriefcaseBusiness aria-hidden="true" />
          <strong>발주자</strong>
          <span>내가 만든 프로젝트</span>
        </div>
        <div className={styles.roleColumn}>
          <UsersRound aria-hidden="true" />
          <strong>지원자</strong>
          <span>모집 중인 프로젝트</span>
        </div>
        <div className={`${styles.roleColumn} ${styles.restrictedRole}`}>
          <LockKeyhole aria-hidden="true" />
          <strong>미선정 지원자</strong>
          <span>계약·검수 정보 숨김</span>
        </div>
      </div>
    ),
    notes:
      "조회에서도 '누가 보고 있는가'가 중요합니다. 발주자는 자신이 만든 프로젝트를 보고, 지원자는 모집 중인 프로젝트를 봅니다. 선정되지 않은 지원자에게 계약이나 검수 정보가 보이면 안 됩니다.",
  },
  {
    id: "slide-26",
    section: "LinKross로 확장하기",
    label: "UPDATE WITH RULES",
    title: "Update — 소유자와 현재 상태를 모두 확인합니다",
    body: (
      <div className={styles.updateGate}>
        <div className={styles.gateQuestion}>
          <UserCheck aria-hidden="true" />
          <p>이 프로젝트를 만든<br /><strong>발주자인가?</strong></p>
        </div>
        <div className={styles.gateOperator}>AND</div>
        <div className={styles.gateQuestion}>
          <ShieldCheck aria-hidden="true" />
          <p>아직 수정 가능한<br /><strong>상태인가?</strong></p>
        </div>
        <ArrowRight aria-hidden="true" className={styles.gateArrow} />
        <div className={styles.gatePass}>
          <PencilLine aria-hidden="true" />
          <strong>DB 변경</strong>
        </div>
      </div>
    ),
    notes:
      "프로젝트 설명이나 모집 기간을 수정할 때는 먼저 이 프로젝트를 만든 발주자인지 확인합니다. 이어서 모집이 이미 마감되지는 않았는지처럼 현재 상태에서 수정해도 되는지 확인합니다. 두 조건을 모두 통과해야 값을 바꿉니다.",
  },
  {
    id: "slide-27",
    section: "LinKross로 확장하기",
    label: "ARCHIVE, DON'T ERASE",
    title: "Delete — 중요한 기록은 지우기보다 보관합니다",
    body: (
      <div className={styles.archiveChoice}>
        <div className={styles.hardDelete}>
          <Trash2 aria-hidden="true" />
          <strong>완전 삭제</strong>
          <span>제안서·SOW·승인 기록까지 사라질 수 있음</span>
        </div>
        <ArrowRight aria-hidden="true" />
        <div className={styles.softArchive}>
          <FileArchive aria-hidden="true" />
          <strong>보관 상태로 변경</strong>
          <span>활성 프로젝트 → 보관된 프로젝트</span>
        </div>
        <p className={styles.archiveConclusion}>모든 Delete가 실제 삭제를 뜻하지는 않습니다.</p>
      </div>
    ),
    notes:
      "Todo는 실제로 지워도 될 수 있지만 LinKross 프로젝트에는 수행 제안서, SOW와 승인 기록이 연결될 수 있습니다. 중요한 기록을 없애기보다 활성 상태를 보관 상태로 바꾸는 것이 더 적절할 수 있습니다. 이것도 백엔드가 내려야 할 판단입니다.",
  },
  {
    id: "slide-28",
    section: "우리의 기술",
    label: "OUR STACK",
    title: "우리는 Next.js + TypeScript + Supabase로 만듭니다",
    body: (
      <div className={styles.stackLayout}>
        <div className={styles.stackLogos}>
          <TechLogo name="Next.js" file="nextjs" />
          <Plus aria-hidden="true" />
          <TechLogo name="TypeScript" file="typescript" />
          <Plus aria-hidden="true" />
          <TechLogo name="Supabase" file="supabase" />
        </div>
        <div className={styles.stackMeaning}>
          <span><strong>Next.js</strong> 화면과 백엔드 동작</span>
          <span><strong>TypeScript</strong> 우리가 쓰는 언어</span>
          <span><strong>Supabase</strong> 사용자와 데이터 저장</span>
        </div>
        <p className={styles.stackConclusion}>새 백엔드 언어를 따로 배우는 것이 아닙니다.</p>
      </div>
    ),
    notes:
      "우리 프로젝트에서는 Next.js로 화면과 백엔드 동작을 만들고, 지금까지 사용한 TypeScript로 코드를 작성하며, Supabase에 사용자와 데이터를 저장합니다. 새로운 백엔드 언어를 따로 시작한다고 생각하지 않아도 됩니다.",
  },
  {
    id: "slide-29",
    section: "LinKross 백엔드 예시",
    label: "PROMPT EXAMPLE 01 · PROPOSAL",
    title: "수행 제안서 제출 — AI에게 이렇게 요청합니다",
    variant: "prompt",
    body: (
      <div className={styles.examplePromptLayout}>
        <div className={styles.examplePromptContext}>
          <Send aria-hidden="true" />
          <strong>만들 기능</strong>
          <span>지원자가 프로젝트에 수행 제안서를 제출한다.</span>
          <small>규칙과 저장할 데이터까지 말해야 백엔드가 완성됩니다.</small>
        </div>
        <div className={styles.promptPaper}>
          <div className={styles.promptHeader}>
            <MessageSquareText aria-hidden="true" />
            <strong>LinKross의 수행 제안서 제출 백엔드 기능을 만들어줘.</strong>
          </div>
          <div className={styles.promptLines}>
            <p><span>누가</span> 로그인한 지원자만 사용할 수 있어.</p>
            <p><span>입력</span> 프로젝트 ID와 수행 제안서 원문을 받아.</p>
            <p><span>규칙</span> 모집 중이어야 하고 같은 프로젝트에 두 번 제출할 수 없어.</p>
            <p><span>저장</span> 원문, 지원자, 프로젝트와 제출 시각을 Supabase에 저장해.</p>
            <p><span>성공</span> 저장된 제안서와 제출 완료 상태를 반환해.</p>
            <p><span>실패</span> 마감·중복·권한 문제를 이해하기 쉬운 한국어로 알려줘.</p>
          </div>
          <div className={styles.promptFooter}>
            <ShieldCheck aria-hidden="true" />
            <p>기존 코드 구조와 권한 패턴을 먼저 확인하고, 서버에서 규칙을 다시 검증해줘.</p>
          </div>
        </div>
      </div>
    ),
    notes:
      "여러분이 수행 제안서 제출 기능을 구현한다고 생각해 보겠습니다. '제안서 제출 기능 만들어줘'에서 멈추지 말고 누가 쓰는지, 어떤 값을 받는지, 언제 막아야 하는지, 무엇을 저장하고 어떤 결과를 돌려줄지 말합니다. 화면에서 제출 버튼을 숨겼더라도 모집 마감과 중복 제출은 서버가 다시 확인하도록 요청해야 합니다. 이 프롬프트는 그대로 복사하기보다 현재 LinKross 코드의 실제 구조를 확인한 뒤 적용하는 출발점입니다.",
  },
  {
    id: "slide-30",
    section: "LinKross 백엔드 예시",
    label: "PROMPT EXAMPLE 02 · SOW APPROVAL",
    title: "SOW 승인 — 상태가 아니라 기록을 요청합니다",
    variant: "prompt",
    body: (
      <div className={`${styles.examplePromptLayout} ${styles.examplePromptLayoutReverse}`}>
        <div className={styles.examplePromptContext}>
          <BadgeCheck aria-hidden="true" />
          <strong>만들 기능</strong>
          <span>발주자와 개발자가 같은 SOW 버전을 승인한다.</span>
          <small>승인은 누가 어느 버전에 동의했는지 남기는 기록입니다.</small>
        </div>
        <div className={styles.promptPaper}>
          <div className={styles.promptHeader}>
            <MessageSquareText aria-hidden="true" />
            <strong>LinKross의 SOW 승인 백엔드 기능을 만들어줘.</strong>
          </div>
          <div className={styles.promptLines}>
            <p><span>누가</span> 프로젝트 발주자와 선정된 개발자가 사용할 수 있어.</p>
            <p><span>입력</span> 프로젝트 ID와 승인할 SOW 버전을 받아.</p>
            <p><span>규칙</span> 프로젝트 참여자이며 최신 버전을 보고 있을 때만 승인해.</p>
            <p><span>저장</span> 승인자, 역할, 승인 시각과 SOW 버전을 기록해.</p>
            <p><span>성공</span> 양측이 같은 버전을 승인하면 그 버전을 고정해.</p>
            <p><span>실패</span> 권한이 없거나 오래된 버전이면 이유를 알려줘.</p>
          </div>
          <div className={styles.promptFooter}>
            <LockKeyhole aria-hidden="true" />
            <p>승인된 원문을 덮어쓰지 말고, 이후 변경은 새 버전으로 남겨줘.</p>
          </div>
        </div>
      </div>
    ),
    notes:
      "이번에는 SOW 승인입니다. 단순히 approved를 true로 바꿔 달라고 요청하면 누구의 어떤 동의를 의미하는지 빠질 수 있습니다. 발주자와 선정된 개발자만 승인할 수 있고, 같은 최신 버전에 동의했는지 확인하며, 승인자·역할·시각·버전을 기록하도록 말합니다. 승인된 원문은 조용히 수정하지 않고 변경이 필요하면 새 버전을 만들도록 요청하는 것도 중요한 백엔드 규칙입니다.",
  },
  {
    id: "slide-31",
    section: "LinKross 백엔드 예시",
    label: "PROMPT EXAMPLE 03 · VERIFICATION",
    title: "검수 요청 — 무엇을 검수할지 정확히 고정합니다",
    variant: "prompt",
    body: (
      <div className={styles.examplePromptLayout}>
        <div className={styles.examplePromptContext}>
          <Code2 aria-hidden="true" />
          <strong>만들 기능</strong>
          <span>개발자가 PR과 Commit SHA로 검수를 요청한다.</span>
          <small>브랜치가 아니라 바뀌지 않는 Commit SHA를 기준으로 삼습니다.</small>
        </div>
        <div className={styles.promptPaper}>
          <div className={styles.promptHeader}>
            <MessageSquareText aria-hidden="true" />
            <strong>LinKross의 GitHub 검수 요청 백엔드 기능을 만들어줘.</strong>
          </div>
          <div className={styles.promptLines}>
            <p><span>누가</span> 프로젝트에 선정된 개발자만 사용할 수 있어.</p>
            <p><span>입력</span> 마일스톤, PR 주소와 Commit SHA를 받아.</p>
            <p><span>규칙</span> 저장소 접근 권한과 중복 실행 여부를 확인해.</p>
            <p><span>저장</span> 요청자, PR, SHA, 완료조건 버전과 대기 상태를 기록해.</p>
            <p><span>성공</span> 생성된 검수 요청 ID와 현재 상태를 반환해.</p>
            <p><span>실패</span> 권한·중복·잘못된 SHA 문제를 구분해서 알려줘.</p>
          </div>
          <div className={styles.promptFooter}>
            <ShieldCheck aria-hidden="true" />
            <p>같은 요청이 두 번 와도 검수가 중복 실행되지 않게 처리해줘.</p>
          </div>
        </div>
      </div>
    ),
    notes:
      "검수 요청에서는 검수 대상을 정확히 특정하는 것이 핵심입니다. 프로젝트의 선정 개발자인지, 저장소에 접근할 수 있는지, 동일한 요청이 이미 실행 중인지 확인하게 합니다. 브랜치는 계속 움직이므로 Commit SHA와 완료조건 버전을 함께 저장하도록 요청합니다. 외부 이벤트나 버튼 중복 클릭으로 같은 요청이 두 번 와도 검수가 중복 생성되지 않도록 말해 주면 더 안전한 구현이 됩니다.",
  },
  {
    id: "slide-32",
    section: "LinKross 백엔드 예시",
    label: "PROMPT EXAMPLE 04 · RE-VERIFY",
    title: "재검수 — 덮어쓰지 말고 변화 과정을 남깁니다",
    variant: "prompt",
    body: (
      <div className={`${styles.examplePromptLayout} ${styles.examplePromptLayoutReverse}`}>
        <div className={styles.examplePromptContext}>
          <RefreshCw aria-hidden="true" />
          <strong>만들 기능</strong>
          <span>개발자가 수정한 새 Commit SHA로 재검수를 요청한다.</span>
          <small>기존 결과를 보존해야 무엇이 개선됐는지 비교할 수 있습니다.</small>
        </div>
        <div className={styles.promptPaper}>
          <div className={styles.promptHeader}>
            <MessageSquareText aria-hidden="true" />
            <strong>LinKross의 재검수 요청 백엔드 기능을 만들어줘.</strong>
          </div>
          <div className={styles.promptLines}>
            <p><span>누가</span> 프로젝트에 선정된 개발자만 사용할 수 있어.</p>
            <p><span>입력</span> 이전 검수 ID와 새로운 Commit SHA를 받아.</p>
            <p><span>규칙</span> 같은 마일스톤이며 다른 SHA일 때만 허용해.</p>
            <p><span>저장</span> 이전 검수와 연결된 새로운 검수 이력을 만들어.</p>
            <p><span>성공</span> 이전 결과와 이번 결과를 비교할 수 있게 반환해.</p>
            <p><span>실패</span> 같은 SHA·진행 중·권한 문제를 구분해서 알려줘.</p>
          </div>
          <div className={styles.promptFooter}>
            <FileArchive aria-hidden="true" />
            <p>이전 로그·스크린샷·조건별 결과를 삭제하거나 덮어쓰지 마.</p>
          </div>
        </div>
      </div>
    ),
    notes:
      "재검수는 단순 Update가 아닙니다. 이전 검수 ID와 새 Commit SHA를 입력받아 같은 마일스톤의 다른 커밋인지 확인하고, 이전 기록과 연결된 새 검수 이력을 만들도록 요청합니다. 이전 로그, 스크린샷과 조건별 결과를 보존해야 발주자가 무엇이 어떻게 개선됐는지 비교할 수 있습니다. 실패 이유도 같은 SHA인지, 이미 진행 중인지, 권한이 없는지 나눠 달라고 말합니다.",
  },
  {
    id: "slide-33",
    section: "백엔드 바이브코딩",
    label: "THE SIX BOXES",
    title: "백엔드 작업이 막히면 여섯 칸부터 채우세요",
    variant: "section",
    body: (
      <div className={styles.sixBoxOverview}>
        <span><strong>1</strong>누가?</span>
        <span><strong>2</strong>무엇을?</span>
        <span><strong>3</strong>어떤 정보?</span>
        <span><strong>4</strong>어떤 규칙?</span>
        <span><strong>5</strong>어떤 데이터?</span>
        <span><strong>6</strong>어떤 결과?</span>
      </div>
    ),
    notes:
      "백엔드 작업이 잘 떠오르지 않을 때 프레임워크부터 검색하지 마세요. 누가, 무엇을, 어떤 정보로, 어떤 규칙 아래 실행하고, 어떤 데이터를 처리하며, 성공과 실패를 어떻게 보여줄지 여섯 칸부터 채우면 됩니다.",
  },
  {
    id: "slide-34",
    section: "백엔드 바이브코딩",
    label: "BOXES 1—3",
    title: "먼저 사용자, 행동, 입력 정보를 정합니다",
    body: (
      <div className={styles.questionSequence}>
        <QuestionNumber number="1">
          <UserRound aria-hidden="true" />
          <strong>누가?</strong>
          <span>로그인한 발주자</span>
        </QuestionNumber>
        <QuestionNumber number="2">
          <BriefcaseBusiness aria-hidden="true" />
          <strong>무엇을?</strong>
          <span>프로젝트를 등록한다</span>
        </QuestionNumber>
        <QuestionNumber number="3">
          <ClipboardCheck aria-hidden="true" />
          <strong>무엇을 입력하나?</strong>
          <span>이름 · 예산 · 일정 · 요구사항</span>
        </QuestionNumber>
      </div>
    ),
    notes:
      "첫 세 칸은 사용자의 의도를 정의합니다. 누가 이 기능을 쓰는지, 그 사람이 무엇을 하는지, 그 행동에 어떤 정보가 필요한지 적습니다. 프로젝트 등록이라면 로그인한 발주자, 등록 행동, 이름·예산·일정·요구사항이 됩니다.",
  },
  {
    id: "slide-35",
    section: "백엔드 바이브코딩",
    label: "BOXES 4—6",
    title: "다음은 규칙, 데이터, 사용자에게 보일 결과입니다",
    body: (
      <div className={styles.questionSequence}>
        <QuestionNumber number="4">
          <ShieldCheck aria-hidden="true" />
          <strong>어떤 규칙?</strong>
          <span>발주자만 · 필수값 · 날짜 순서</span>
        </QuestionNumber>
        <QuestionNumber number="5">
          <Database aria-hidden="true" />
          <strong>무엇을 처리?</strong>
          <span>새 프로젝트와 생성 시각 저장</span>
        </QuestionNumber>
        <QuestionNumber number="6">
          <BadgeCheck aria-hidden="true" />
          <strong>어떤 결과?</strong>
          <span>이동 · 한국어 오류 · 재시도</span>
        </QuestionNumber>
      </div>
    ),
    notes:
      "뒤의 세 칸은 시스템의 책임을 정의합니다. 언제 허용하고 막을지, DB에 무엇을 저장하거나 가져올지, 성공과 실패를 사용자에게 어떻게 보여줄지 적습니다. 저장 중 중복 클릭 방지와 다시 시도할 방법도 결과에 포함됩니다.",
  },
  {
    id: "slide-36",
    section: "백엔드 바이브코딩",
    label: "ONE SENTENCE",
    title: "여섯 칸은 결국 한 문장으로 이어집니다",
    body: (
      <blockquote className={styles.sixBoxSentence}>
        <strong>누가</strong>, <strong>무엇을</strong>, <strong>어떤 정보로</strong>,<br />
        <strong>어떤 규칙</strong> 아래 실행하고,<br />
        <strong>무엇을 저장</strong>하며, <strong>결과를 어떻게 보여줄 것인가?</strong>
      </blockquote>
    ),
    notes:
      "여섯 칸을 따로 외울 필요는 없습니다. 이 한 문장으로 자연스럽게 이어 말할 수 있으면 됩니다. 기능을 만들기 전에 이 문장에 답해 보면 빠진 규칙이나 실패 경로가 보이기 시작합니다.",
  },
  {
    id: "slide-37",
    section: "실전 프롬프트",
    label: "PROMPT · PART 1",
    title: "프로젝트 생성 요청 — 먼저 행동과 규칙을 말합니다",
    variant: "prompt",
    body: (
      <div className={styles.promptPaper}>
        <div className={styles.promptHeader}>
          <MessageSquareText aria-hidden="true" />
          <strong>LinKross의 프로젝트 생성 기능을 만들어줘.</strong>
        </div>
        <div className={styles.promptLines}>
          <p><span>누가</span> 로그인한 발주자만 사용할 수 있어.</p>
          <p><span>무엇을</span> 새로운 외주 개발 프로젝트를 등록해.</p>
          <p><span>입력</span> 이름, 목표, 요구사항, 예산, 일정, 모집 기간.</p>
          <p><span>규칙</span> 필수값을 확인하고, 종료일이 시작일보다 빠르면 막아줘.</p>
        </div>
      </div>
    ),
    notes:
      "실제 AI 요청의 앞부분입니다. 기능 이름만 말하지 않고 누가 쓰는지, 무엇을 하는지, 어떤 입력이 필요한지, 언제 허용하거나 막아야 하는지를 적습니다. 개발 용어가 많지 않아도 서비스 동작은 충분히 정확해집니다.",
  },
  {
    id: "slide-38",
    section: "실전 프롬프트",
    label: "PROMPT · PART 2",
    title: "프로젝트 생성 요청 — 저장과 결과까지 끝맺습니다",
    variant: "prompt",
    body: (
      <div className={styles.promptPaper}>
        <div className={styles.promptLines}>
          <p><span>저장</span> Supabase에 프로젝트, 만든 사용자, 생성 시각을 저장해.</p>
          <p><span>성공</span> 생성된 프로젝트 상세 화면으로 이동해.</p>
          <p><span>실패</span> 이해할 수 있는 한국어 오류와 재시도 방법을 보여줘.</p>
          <p><span>진행</span> 저장 중 중복 클릭을 막아줘.</p>
        </div>
        <div className={styles.promptFooter}>
          <BookOpenText aria-hidden="true" />
          <p>기존 LinKross 코드 구조를 먼저 확인하고,<br />작은 단계로 구현한 뒤 직접 확인할 항목을 알려줘.</p>
        </div>
      </div>
    ),
    notes:
      "뒤에서는 DB에 무엇을 남길지, 성공과 실패를 어떻게 보여줄지 설명합니다. 마지막으로 기존 코드 구조를 먼저 확인하고 작은 단계로 구현하며 확인 항목을 알려 달라고 요청합니다. 이렇게 하면 AI가 프로젝트 맥락을 무시하고 큰 덩어리로 코드를 바꾸는 일을 줄일 수 있습니다.",
  },
  {
    id: "slide-39",
    section: "정리",
    label: "FOUR THINGS TO REMEMBER",
    title: "오늘 기억할 것은 딱 네 가지입니다",
    body: (
      <div className={styles.fourTakeaways}>
        <div><Database aria-hidden="true" /><strong>DB</strong><span>데이터를 기억한다</span></div>
        <div><MessageSquareText aria-hidden="true" /><strong>API</strong><span>요청을 전달한다</span></div>
        <div><ClipboardCheck aria-hidden="true" /><strong>CRUD</strong><span>만들고·보고·고치고·지운다</span></div>
        <div><BrainCircuit aria-hidden="true" /><strong>바이브코딩</strong><span>사용자와 규칙을 설명한다</span></div>
      </div>
    ),
    notes:
      "오늘 내용은 네 줄로 정리됩니다. DB는 데이터를 기억하고, API는 화면의 요청을 백엔드에 전달하고, CRUD는 만들기·보기·수정하기·삭제하기이며, 백엔드 바이브코딩은 사용자와 규칙을 정확히 설명하는 일입니다.",
  },
  {
    id: "slide-40",
    section: "정리",
    label: "YOUR NEXT BACKEND FEATURE",
    title: "다음 기능부터, 이 여섯 질문으로 시작하세요",
    variant: "cover",
    body: (
      <div className={styles.closingBody}>
        <h1 className={styles.coverTitle}>다음 기능부터, 이 여섯 질문으로 시작하세요</h1>
        <div className={styles.closingQuestions}>
          <span>누가?</span>
          <span>무엇을?</span>
          <span>어떤 정보?</span>
          <span>어떤 규칙?</span>
          <span>어떤 데이터?</span>
          <span>성공과 실패는?</span>
        </div>
        <p className={styles.closingStatement}>설명할 수 있다면,<br /><strong>AI와 함께 만들 수 있습니다.</strong></p>
        <div className={styles.closingBrand}>
          <BrandLogo />
        </div>
      </div>
    ),
    notes:
      "앞으로 백엔드 기능을 만들 때는 이 여섯 질문부터 떠올려 주세요. 이 질문에 답할 수 있다면 AI와 함께 LinKross의 백엔드 기능을 하나씩 만들 수 있습니다. 코드 전체를 외우는 것보다, 서비스가 어떻게 동작해야 하는지 정확히 말하는 힘이 먼저입니다.",
  },
] satisfies DeckSlide[];

export const backendVibeSlides = slides;
