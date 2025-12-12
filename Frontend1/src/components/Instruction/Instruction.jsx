import "./Instruction.css";
import tableImage from "../../images/tablecontent.jpeg";
import { GoZoomIn } from "react-icons/go";
import { AiOutlineZoomOut } from "react-icons/ai";

const Instruction = ({
  candidateName = "John Smith",
  onNext,
  examTitle = "CAT 2025",
}) => {
  return (
    <div className="cat-instructions-page">
      {/* Top header (logos row + title) */}
      <div className="cat-topbar">
        <div className="cat-logos-strip" aria-hidden="true">
          {/* NOTE:
            Exact logos image/strip tum apne assets me add kar sakte ho.
            Abhi CSS me placeholder dots/spacing se same look feel banaya hai.
          */}
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
        </div>

        <div className="cat-title">{examTitle}</div>
      </div>

      {/* Main body */}
      <div className="cat-shell">
        {/* Left panel */}
        <div className="cat-left">
          <div className="cat-left-header">Instructions</div>

          <div className="cat-left-scroll">
            <div className="cat-callout">
              The number, type and pattern of questions, as well as sequence and
              timing of sections in the Mock Exam are only indicative and these
              are subject to variations from year to year as decided by the CAT
              authorities.
            </div>

            <div className="cat-section-title">General Instructions:</div>

            <ol className="cat-ol">
              <li>
                To log in, enter your registration number and password following
                the instructions provided to you by the invigilator.
              </li>
              <li>
                The total duration of the test is 120 minutes. For PwD
                candidates, the total duration is 160 minutes.
              </li>
              <li>
                The test has 3 (three) sections. The time allotted to each
                section is 40 minutes (53 minutes and 20 seconds for PwD
                candidates). As soon as the candidate visits a section, the
                clock (displayed as “Time Left” in the top right corner of the
                screen) will start. On completion of 40 minutes, the clock will
                stop, the particular section will be locked, and the answers to
                questions in that section will be auto-submitted.
              </li>
              <li>
                For PwD candidates, the process will be the same as above. The
                only exception is that, for each section, the PwD candidate will
                have 53 minutes and 20 seconds.
              </li>
              <li>
                The candidate’s computer time will be synchronized with the
                server clock. The countdown timer (“Time Left”) indicates the
                remaining time to complete the current section. When the timer
                reaches zero, the section test will automatically end.
              </li>
              <li>
                No candidate will be allowed to leave the test hall before 120
                minutes.
              </li>
              <li>
                The question paper will include a mix of Multiple-Choice
                Questions (MCQs) with options and Non-MCQs.
              </li>
              <li>
                Candidates are expected to familiarize themselves with various
                symbols before starting the test. The question palette displayed
                on the right side of the screen will show the status of each
                question.
              </li>
            </ol>

            {/* Status table image (same as your existing) */}
            <div className="cat-table-block">
              <img
                src={tableImage}
                alt="Question Status Table"
                className="cat-table-image"
              />
            </div>

            <div className="cat-muted">
              *Answers to all questions flagged as “Marked for Review” (Serial
              No. E) will be automatically considered as submitted for
              evaluation at the end of the time allotted for that section.
            </div>

            <div className="cat-paragraph">
              Click the “&gt;” arrow to the left of the question palette to
              collapse it and make the window larger. To reopen the question
              palette, click the “&lt;” arrow on the right side of the console.
            </div>

            <div className="cat-section-title">
              To answer a question, follow these steps:
            </div>

            <ol className="cat-ol alpha">
              <li>
                Click on the question number in the question palette to go
                directly to that question.
              </li>
              <li>
                Select an answer for an MCQ by clicking the radio button located
                to the left of the choice.
              </li>
              <li>
                For a non-MCQ, enter only a whole number as the answer in the
                provided space using the on-screen keyboard.
              </li>
            </ol>

            <div className="cat-paragraph">
              PwD candidates with blindness/low vision will have screen
              magnification enabled by default and will find two magnifying
              icons:
              <span className="cat-zoom-icons">
                <GoZoomIn className="cat-zoom-ico" />
                <AiOutlineZoomOut className="cat-zoom-ico" />
              </span>
            </div>
          </div>

          {/* Bottom Next button (like screenshot) */}
          <div className="cat-left-footer">
            <button
              type="button"
              className="cat-next-btn"
              onClick={() => onNext?.()}
            >
              Next <span className="cat-next-arrow">›</span>
            </button>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="cat-divider" />

        {/* Right panel */}
        <div className="cat-right">
          <div className="candidate-card">
            <div className="candidate-avatar" aria-hidden="true">
              {/* simple avatar svg to match CAT style */}
              <svg viewBox="0 0 128 128" width="84" height="84">
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#c9c9c9" />
                    <stop offset="1" stopColor="#8f8f8f" />
                  </linearGradient>
                </defs>
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="url(#g)"
                  stroke="#6f6f6f"
                  strokeWidth="3"
                />
                <circle
                  cx="64"
                  cy="50"
                  r="18"
                  fill="#ededed"
                  stroke="#7b7b7b"
                  strokeWidth="2"
                />
                <path
                  d="M28 104c6-18 20-28 36-28s30 10 36 28"
                  fill="#ededed"
                  stroke="#7b7b7b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="candidate-name">{candidateName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instruction;
