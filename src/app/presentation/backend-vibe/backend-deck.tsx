"use client";

import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Grid3X3,
  HelpCircle,
  Minimize,
  NotebookText,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { slides } from "./slides";
import styles from "./backend-deck.module.css";

const SLIDE_HASH_PATTERN = /^#slide-(\d+)$/;

function clampSlideIndex(index: number) {
  return Math.min(Math.max(index, 0), slides.length - 1);
}

function getSlideIndexFromHash() {
  if (typeof window === "undefined") {
    return 0;
  }

  const match = window.location.hash.match(SLIDE_HASH_PATTERN);
  return match ? clampSlideIndex(Number(match[1]) - 1) : 0;
}

export function BackendDeck() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [areNotesOpen, setAreNotesOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentSlide = slides[currentIndex];
  const progress = ((currentIndex + 1) / slides.length) * 100;

  const goTo = useCallback((nextIndex: number) => {
    const safeIndex = clampSlideIndex(nextIndex);
    setCurrentIndex(safeIndex);

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#slide-${safeIndex + 1}`);
    }
  }, []);

  const goBack = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const goForward = useCallback(
    () => goTo(currentIndex + 1),
    [currentIndex, goTo],
  );

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setIsHelpOpen(true);
    }
  }, []);

  useEffect(() => {
    const initialFrame = window.requestAnimationFrame(() => {
      goTo(getSlideIndexFromHash());
    });

    const handleHashChange = () => setCurrentIndex(getSlideIndexFromHash());
    const handleFullscreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));

    window.addEventListener("hashchange", handleHashChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("hashchange", handleHashChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [goTo]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isTyping) {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          event.preventDefault();
          goForward();
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
        case "Backspace":
          event.preventDefault();
          goBack();
          break;
        case "Home":
          event.preventDefault();
          goTo(0);
          break;
        case "End":
          event.preventDefault();
          goTo(slides.length - 1);
          break;
        case "f":
        case "F":
          event.preventDefault();
          void toggleFullscreen();
          break;
        case "o":
        case "O":
          event.preventDefault();
          setIsOverviewOpen((open) => !open);
          break;
        case "n":
        case "N":
          event.preventDefault();
          setAreNotesOpen((open) => !open);
          break;
        case "?":
          event.preventDefault();
          setIsHelpOpen((open) => !open);
          break;
        case "Escape":
          setIsOverviewOpen(false);
          setAreNotesOpen(false);
          setIsHelpOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack, goForward, goTo, toggleFullscreen]);

  const controlsLabel = `${currentIndex + 1} / ${slides.length} · ${currentSlide.section}`;

  return (
    <main className={styles.deckViewport} aria-label="백엔드 바이브코딩 발표 자료">
      <div className={styles.progressTrack} aria-hidden="true">
        <span className={styles.progressBar} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.stageWrap}>
        <article
          key={currentSlide.id}
          className={`${styles.slideFrame} ${styles[`variant_${currentSlide.variant ?? "default"}`]}`}
          aria-labelledby={
            currentSlide.variant === "cover"
              ? undefined
              : `slide-title-${currentSlide.id}`
          }
          aria-label={currentSlide.variant === "cover" ? currentSlide.title : undefined}
          aria-roledescription="slide"
        >
          <div className={styles.accentRail} aria-hidden="true" />
          <div className={styles.slideChrome}>
            <header className={styles.slideHeader}>
              <p className={styles.eyebrow}>{currentSlide.label}</p>
              {currentSlide.variant !== "cover" ? (
                <h1 id={`slide-title-${currentSlide.id}`} className={styles.slideTitle}>
                  {currentSlide.title}
                </h1>
              ) : null}
            </header>

            <div className={styles.slideBody}>{currentSlide.body}</div>

            <footer className={styles.slideFooter}>
              <span>LinKross · Backend Vibe Coding</span>
              <span className={styles.footerRule} aria-hidden="true" />
              <span>{String(currentIndex + 1).padStart(2, "0")}</span>
            </footer>
          </div>
        </article>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {currentIndex + 1}번 슬라이드, {currentSlide.title}
      </p>

      <nav className={styles.controlDock} aria-label="슬라이드 조작">
        <button
          type="button"
          className={styles.iconButton}
          onClick={goBack}
          disabled={currentIndex === 0}
          aria-label="이전 슬라이드"
          title="이전 슬라이드 (←)"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.slideCounter}
          onClick={() => setIsOverviewOpen(true)}
          aria-label={`${controlsLabel}. 전체 슬라이드 보기`}
        >
          {currentIndex + 1} <span>/ {slides.length}</span>
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={goForward}
          disabled={currentIndex === slides.length - 1}
          aria-label="다음 슬라이드"
          title="다음 슬라이드 (→ 또는 Space)"
        >
          <ChevronRight aria-hidden="true" />
        </button>
        <span className={styles.dockDivider} aria-hidden="true" />
        <button
          type="button"
          className={`${styles.iconButton} ${isOverviewOpen ? styles.activeControl : ""}`}
          onClick={() => setIsOverviewOpen((open) => !open)}
          aria-pressed={isOverviewOpen}
          aria-label="전체 슬라이드 보기"
          title="전체 슬라이드 (O)"
        >
          <Grid3X3 aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${styles.iconButton} ${areNotesOpen ? styles.activeControl : ""}`}
          onClick={() => setAreNotesOpen((open) => !open)}
          aria-pressed={areNotesOpen}
          aria-label="발표자 노트 보기"
          title="발표자 노트 (N)"
        >
          <NotebookText aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => void toggleFullscreen()}
          aria-label={isFullscreen ? "전체 화면 종료" : "전체 화면 시작"}
          title="전체 화면 (F)"
        >
          {isFullscreen ? <Minimize aria-hidden="true" /> : <Expand aria-hidden="true" />}
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setIsHelpOpen(true)}
          aria-label="키보드 도움말"
          title="도움말 (?)"
        >
          <HelpCircle aria-hidden="true" />
        </button>
      </nav>

      {isOverviewOpen ? (
        <section
          className={styles.overlayPanel}
          role="dialog"
          aria-modal="true"
          aria-label="전체 슬라이드"
        >
          <div className={styles.overlayHeader}>
            <div>
              <p className={styles.overlayEyebrow}>SLIDE MAP</p>
              <h2>전체 슬라이드</h2>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOverviewOpen(false)}
              aria-label="전체 슬라이드 닫기"
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <div className={styles.overviewGrid}>
            {slides.map((slide, index) => (
              <button
                type="button"
                key={slide.id}
                className={`${styles.overviewCard} ${
                  index === currentIndex ? styles.currentOverviewCard : ""
                }`}
                onClick={() => {
                  goTo(index);
                  setIsOverviewOpen(false);
                }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{slide.title}</strong>
                <small>{slide.section}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {areNotesOpen ? (
        <aside className={styles.notesPanel} aria-label="발표자 노트">
          <div className={styles.notesHeader}>
            <div>
              <p>발표자 노트</p>
              <strong>{currentSlide.title}</strong>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setAreNotesOpen(false)}
              aria-label="발표자 노트 닫기"
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <div className={styles.notesContent}>{currentSlide.notes}</div>
        </aside>
      ) : null}

      {isHelpOpen ? (
        <section className={styles.helpDialog} role="dialog" aria-modal="true" aria-label="키보드 도움말">
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setIsHelpOpen(false)}
            aria-label="도움말 닫기"
          >
            <X aria-hidden="true" />
          </button>
          <p className={styles.overlayEyebrow}>PRESENTATION MODE</p>
          <h2>키보드로 빠르게 발표하세요</h2>
          <dl className={styles.shortcutGrid}>
            <div><dt>← / → · Space</dt><dd>슬라이드 이동</dd></div>
            <div><dt>Home / End</dt><dd>처음·마지막으로 이동</dd></div>
            <div><dt>F</dt><dd>전체 화면</dd></div>
            <div><dt>O</dt><dd>전체 슬라이드</dd></div>
            <div><dt>N</dt><dd>발표자 노트</dd></div>
            <div><dt>Esc</dt><dd>열린 패널 닫기</dd></div>
          </dl>
        </section>
      ) : null}
    </main>
  );
}
