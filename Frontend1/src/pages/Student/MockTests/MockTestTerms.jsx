import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './MockTestTerms.css';

const MockTestTerms = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [testDetails, setTestDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  const fetchTestDetails = async () => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');

      const response = await fetch(`/api/mock-tests/test/${testId}/details`, {
        headers: authToken ? {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        } : {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setTestDetails(data.test);
      } else {
        console.error('Failed to fetch test details:', data.message);
        navigate('/student/dashboard');
      }
    } catch (error) {
      console.error('Error fetching test details:', error);
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    try {
      console.log('Attempting development login...');
      const response = await fetch('/api/dev/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse dev login response:', parseError);
        return false;
      }

      if (response.ok && data.success && data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Development user logged in successfully');
        return true;
      } else {
        console.error('Dev login failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Dev login error:', error);
      return false;
    }
  };

  const handleStartTest = async () => {
    if (!declarationChecked) {
      alert('Please accept the declaration before starting the test.');
      return;
    }

    if (isStarting) {
      return;
    }

    setIsStarting(true);

    try {
      let authToken = localStorage.getItem('authToken');

      if (!authToken || authToken === 'null' || authToken === 'undefined') {
        const devLoginSuccess = await handleDevLogin();
        if (devLoginSuccess) {
          authToken = localStorage.getItem('authToken');
        } else {
          alert('Authentication failed. Please try again or contact support.');
          setIsStarting(false);
          return;
        }
      }

      const response = await fetch(`/api/mock-tests/test/${testId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        data = {
          success: false,
          message: `Server returned invalid response (${response.status}): ${response.statusText}`
        };
      }

      if (!response.ok) {
        const errorMsg = data.message || `HTTP error! status: ${response.status}`;
        
        if (response.status === 401) {
          alert('Authentication failed. Please try logging in again.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        } else {
          alert('Error: ' + errorMsg);
        }
        setIsStarting(false);
        return;
      }

      if (data.success) {
        const attemptId = data.attempt?._id || data.attemptId;
        if (attemptId) {
          navigate(`/student/mock-test/${testId}/attempt/${attemptId}`);
        } else {
          throw new Error('No attempt ID received from server');
        }
      } else {
        alert(data.message || 'Failed to start test');
        setIsStarting(false);
      }
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Failed to start test. Please try again.');
      setIsStarting(false);
    }
  };

  const handlePrevious = () => {
    navigate(`/student/mock-test/${testId}/instructions`);
  };

  const getUserName = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.name || 'John Smith';
    } catch {
      return 'John Smith';
    }
  };

  if (loading) {
    return (
      <div className="cat-terms-page">
        <div className="cat-loading">
          <div className="cat-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!testDetails) {
    return (
      <div className="cat-terms-page">
        <div className="cat-error">
          <h3>Test Not Found</h3>
          <button onClick={() => navigate('/student/dashboard')}>
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cat-terms-page">
      <div className="cat-header">
        <div className="cat-header-top">
          <img src="/cat-iim-banner.png" alt="CAT 2025 - IIM Logos" className="cat-iim-banner" />
        </div>
        <div className="cat-header-bar">
          <span>Other Important Instructions</span>
        </div>
      </div>

      <div className="cat-content">
        <div className="cat-main-panel">
          <div className="cat-terms-panel">
            <div className="terms-content">
              <h3 className="section-title">Section Specific Information:</h3>
              
              <ol className="instruction-list">
                <li>
                  The number of items on the test are as follows:
                  <div className="sections-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Section</th>
                          <th>No. of Items</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Verbal Ability and Reading Comprehension (VARC)</td>
                          <td>24</td>
                        </tr>
                        <tr>
                          <td>Data Interpretation and Logical Reasoning (DILR)</td>
                          <td>22</td>
                        </tr>
                        <tr>
                          <td>Quantitative Ability (QA)</td>
                          <td>22</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </li>
                <li>
                  In the <em>Data Interpretation and Logical Reasoning</em> section, each problem is based on situations or scenarios and has either four or five sub-questions.
                </li>
                <li>
                  For <em>Reading Comprehension</em>, each passage consists of a group of four sub-questions.
                </li>
              </ol>

              <div className="declaration-section">
                <label className="declaration-checkbox">
                  <input 
                    type="checkbox" 
                    checked={declarationChecked}
                    onChange={() => setDeclarationChecked(!declarationChecked)}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="declaration-title">Declaration by the Candidate:</span>
                </label>
                <ul className="declaration-list">
                  <li>I have read and understood all the above instructions.</li>
                  <li>I have also read and understood the instructions provided on the admit card and the CAT website and will follow them accordingly.</li>
                  <li>I declare that I am not wearing/carrying/in possession of any electronic communication gadgets or any prohibited material in the examination hall.</li>
                </ul>
              </div>
            </div>

            <div className="bottom-buttons">
              <button className="cat-btn-previous" onClick={handlePrevious}>
                <span className="arrow">{'<'}</span> Previous
              </button>
              <button 
                className={`cat-btn-begin ${!declarationChecked || isStarting ? 'disabled' : ''}`}
                onClick={handleStartTest}
                disabled={!declarationChecked || isStarting}
              >
                {isStarting ? 'Starting...' : 'I am ready to begin'}
              </button>
            </div>
          </div>

          <div className="cat-profile-panel">
            <div className="profile-section">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  <svg viewBox="0 0 100 100" className="avatar-svg">
                    <circle cx="50" cy="35" r="22" fill="#4a90a4"/>
                    <ellipse cx="50" cy="85" rx="35" ry="25" fill="#4a90a4"/>
                  </svg>
                </div>
              </div>
              <div className="profile-name">{getUserName()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockTestTerms;
