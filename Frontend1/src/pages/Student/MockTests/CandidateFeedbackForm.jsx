import React, { useState } from 'react';
import './CandidateFeedbackForm.css';

const CandidateFeedbackForm = ({ onSubmit, onSkip, studentName, testTitle }) => {
  const [responses, setResponses] = useState({
    q1_exam_support: null,
    q2_digital_exam_experience: null,
    q3_1_ease_of_locating: null,
    q3_2_finding_seat: null,
    q3_3_seating_arrangement: null,
    q3_4_basic_facilities: null,
    q3_5_exam_node_quality: null,
    q3_6_staff_behavior: null,
    q4_overall_experience: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleRatingChange = (field, value) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  };

  const handleTextChange = (e) => {
    setResponses(prev => ({ ...prev, q4_overall_experience: e.target.value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(responses);
    setSubmitting(false);
  };

  const RatingOptions = ({ field, value }) => (
    <div className="rating-options">
      {[4, 3, 2, 1].map(num => (
        <label key={num} className="rating-option">
          <input
            type="radio"
            name={field}
            checked={value === num}
            onChange={() => handleRatingChange(field, num)}
          />
          <span className="radio-circle"></span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="feedback-form-container">
      <div className="feedback-header">
        <span>Candidate Feedback Form</span>
      </div>
      
      <div className="feedback-content">
        <div className="feedback-intro">
          <p>Dear {studentName || 'Candidate'},</p>
          <p>We solicit your valuable feedback to understand your views and your experience on the digital examination.</p>
          <p>Your feedback will enable us to improve the overall candidate experience.</p>
          <p>For each question listed below, request you to specify the performance rating as per scale below.</p>
        </div>

        <div className="rating-scale-legend">
          <div className="scale-item">
            <span className="scale-badge blue">4</span>
            <span>Exceeded expectations</span>
          </div>
          <div className="scale-item">
            <span className="scale-badge green">3</span>
            <span>Met expectations</span>
          </div>
          <div className="scale-item">
            <span className="scale-badge yellow">2</span>
            <span>Improvement needed</span>
          </div>
          <div className="scale-item">
            <span className="scale-badge red">1</span>
            <span>Failed to meet expectations</span>
          </div>
        </div>

        <div className="questions-table">
          <div className="table-header">
            <div className="col-sno">S.No</div>
            <div className="col-question">Questions</div>
            <div className="col-response">
              <span>Response</span>
              <div className="response-numbers">
                <span>4</span>
                <span>3</span>
                <span>2</span>
                <span>1</span>
              </div>
            </div>
          </div>

          <div className="question-row">
            <div className="col-sno">1.</div>
            <div className="col-question">
              How was your experience with the exam support provided including usefulness of the mock test, access to exam related information, helpline support, etc?
            </div>
            <div className="col-response">
              <RatingOptions field="q1_exam_support" value={responses.q1_exam_support} />
            </div>
          </div>

          <div className="question-row">
            <div className="col-sno">2.</div>
            <div className="col-question">
              How was your experience in giving a digital exam on aspects such as navigating on the candidate console, ease of using the candidate console, etc?
            </div>
            <div className="col-response">
              <RatingOptions field="q2_digital_exam_experience" value={responses.q2_digital_exam_experience} />
            </div>
          </div>

          <div className="question-row main-question">
            <div className="col-sno">3.</div>
            <div className="col-question">
              How was your experience as to the following aspects of the test-center:
            </div>
            <div className="col-response"></div>
          </div>

          <div className="question-row sub-question">
            <div className="col-sno">3.1</div>
            <div className="col-question">Ease of Locating the Test Center.</div>
            <div className="col-response">
              <RatingOptions field="q3_1_ease_of_locating" value={responses.q3_1_ease_of_locating} />
            </div>
          </div>

          <div className="question-row sub-question">
            <div className="col-sno">3.2</div>
            <div className="col-question">
              Ease of finding your designated exam seat through clear notice board instructions, directional arrows, staff guidance, etc.
            </div>
            <div className="col-response">
              <RatingOptions field="q3_2_finding_seat" value={responses.q3_2_finding_seat} />
            </div>
          </div>

          <div className="question-row sub-question">
            <div className="col-sno">3.3</div>
            <div className="col-question">Seating arrangement</div>
            <div className="col-response">
              <RatingOptions field="q3_3_seating_arrangement" value={responses.q3_3_seating_arrangement} />
            </div>
          </div>

          <div className="question-row sub-question">
            <div className="col-sno">3.4</div>
            <div className="col-question">Availability of basic facilities like water dispenser, rest rooms, etc.</div>
            <div className="col-response">
              <RatingOptions field="q3_4_basic_facilities" value={responses.q3_4_basic_facilities} />
            </div>
          </div>

          <div className="question-row sub-question">
            <div className="col-sno">3.5</div>
            <div className="col-question">Exam node/ desktop quality</div>
            <div className="col-response">
              <RatingOptions field="q3_5_exam_node_quality" value={responses.q3_5_exam_node_quality} />
            </div>
          </div>

          <div className="question-row sub-question">
            <div className="col-sno">3.6</div>
            <div className="col-question">Behavior of staff, their knowledge and competency of conducting the exam.</div>
            <div className="col-response">
              <RatingOptions field="q3_6_staff_behavior" value={responses.q3_6_staff_behavior} />
            </div>
          </div>

          <div className="question-row">
            <div className="col-sno">4.</div>
            <div className="col-question">How was your overall experience of taking up a digital exam?</div>
            <div className="col-response text-response">
              <input
                type="text"
                value={responses.q4_overall_experience}
                onChange={handleTextChange}
                placeholder=""
                className="text-input"
              />
            </div>
          </div>
        </div>

        <div className="feedback-actions">
          <button 
            className="submit-feedback-btn" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
          <button 
            className="skip-feedback-btn" 
            onClick={onSkip}
            disabled={submitting}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateFeedbackForm;
