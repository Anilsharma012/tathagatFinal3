const mongoose = require('mongoose');
const MockTest = require('../models/MockTest');
const MockTestQuestion = require('../models/MockTestQuestion');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const varcPassage1 = `<div style="padding: 15px; background: #f9f9f9; border-left: 4px solid #2d3a8c;">
<h4>Passage 1: The Future of Artificial Intelligence</h4>
<p>Artificial Intelligence has rapidly evolved from a theoretical concept to a transformative force reshaping every industry. From healthcare diagnostics to autonomous vehicles, AI systems are becoming increasingly sophisticated, capable of performing tasks that were once thought to require human intelligence.</p>
<p>The debate around AI ethics has intensified as these systems become more prevalent. Questions about bias in algorithms, job displacement, and the need for regulation have become central to policy discussions worldwide. Tech giants are investing billions in AI research, racing to develop the next breakthrough while governments struggle to keep pace with regulatory frameworks.</p>
<p><strong>Key Statistics:</strong></p>
<ul>
<li>AI market expected to reach $1.8 trillion by 2030</li>
<li>70% of enterprises will adopt AI in some form by 2025</li>
<li>AI could contribute $15.7 trillion to global economy</li>
</ul>
<p>The challenge lies in balancing innovation with responsible development, ensuring that AI benefits humanity while minimizing potential risks.</p>
</div>`;

const varcPassage2 = `<div style="padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107;">
<h4>Para Jumble Exercise</h4>
<p>Rearrange the following sentences to form a coherent paragraph:</p>
<ol>
<li>The rise of remote work has fundamentally altered how companies approach talent acquisition.</li>
<li>This shift has led to increased competition for skilled workers, as geographical boundaries no longer limit hiring.</li>
<li>However, managing distributed teams presents unique challenges in communication and collaboration.</li>
<li>Many organizations have adopted hybrid models that combine the flexibility of remote work with periodic in-office collaboration.</li>
<li>Studies show that remote workers often report higher job satisfaction but may experience feelings of isolation.</li>
</ol>
<p><em>Enter the sequence of sentences (e.g., 14352) that forms the most logical paragraph.</em></p>
</div>`;

const dilrPassage1 = `<div style="padding: 15px; background: #e8f4f8; border-left: 4px solid #17a2b8;">
<h4>Data Set: Company Sales Performance</h4>
<p>A retail company operates in 5 regions: North, South, East, West, and Central. The following data shows quarterly sales (in lakhs):</p>
<table style="width:100%; border-collapse: collapse; margin: 15px 0;">
<tr style="background: #2d3a8c; color: white;">
<th style="padding: 10px; border: 1px solid #ddd;">Region</th>
<th style="padding: 10px; border: 1px solid #ddd;">Q1</th>
<th style="padding: 10px; border: 1px solid #ddd;">Q2</th>
<th style="padding: 10px; border: 1px solid #ddd;">Q3</th>
<th style="padding: 10px; border: 1px solid #ddd;">Q4</th>
</tr>
<tr><td style="padding: 8px; border: 1px solid #ddd;">North</td><td style="padding: 8px; border: 1px solid #ddd;">245</td><td style="padding: 8px; border: 1px solid #ddd;">268</td><td style="padding: 8px; border: 1px solid #ddd;">312</td><td style="padding: 8px; border: 1px solid #ddd;">298</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd;">South</td><td style="padding: 8px; border: 1px solid #ddd;">189</td><td style="padding: 8px; border: 1px solid #ddd;">215</td><td style="padding: 8px; border: 1px solid #ddd;">243</td><td style="padding: 8px; border: 1px solid #ddd;">267</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd;">East</td><td style="padding: 8px; border: 1px solid #ddd;">178</td><td style="padding: 8px; border: 1px solid #ddd;">192</td><td style="padding: 8px; border: 1px solid #ddd;">186</td><td style="padding: 8px; border: 1px solid #ddd;">201</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd;">West</td><td style="padding: 8px; border: 1px solid #ddd;">312</td><td style="padding: 8px; border: 1px solid #ddd;">298</td><td style="padding: 8px; border: 1px solid #ddd;">325</td><td style="padding: 8px; border: 1px solid #ddd;">356</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd;">Central</td><td style="padding: 8px; border: 1px solid #ddd;">156</td><td style="padding: 8px; border: 1px solid #ddd;">178</td><td style="padding: 8px; border: 1px solid #ddd;">189</td><td style="padding: 8px; border: 1px solid #ddd;">195</td></tr>
</table>
<p><strong>Additional Information:</strong></p>
<ul>
<li>Target for each region was 1000 lakhs for the year</li>
<li>Incentive: 5% bonus on sales exceeding target</li>
<li>Growth target: 15% YoY increase</li>
</ul>
</div>`;

const dilrPassage2 = `<div style="padding: 15px; background: #f0fff0; border-left: 4px solid #28a745;">
<h4>Logical Reasoning: Tournament Schedule</h4>
<p>Eight teams (A, B, C, D, E, F, G, H) participated in a knockout tournament. The following conditions apply:</p>
<ul>
<li>Team A played against Team H in the first round</li>
<li>The winner of A vs H played against the winner of B vs G</li>
<li>Team C defeated Team F in the first round</li>
<li>Team D and Team E played in different halves of the draw</li>
<li>The final was between teams from different halves</li>
<li>Team B reached the semi-finals but lost</li>
<li>Team E won the tournament</li>
</ul>
<p>Based on this information, answer the following questions.</p>
</div>`;

const qaPassage1 = `<div style="padding: 15px; background: #fff0f5; border-left: 4px solid #dc3545;">
<h4>Quantitative Analysis: Investment Problem</h4>
<p>Rahul has Rs. 50,000 to invest. He considers the following options:</p>
<table style="width:100%; border-collapse: collapse; margin: 15px 0;">
<tr style="background: #dc3545; color: white;">
<th style="padding: 10px; border: 1px solid #ddd;">Investment</th>
<th style="padding: 10px; border: 1px solid #ddd;">Annual Return</th>
<th style="padding: 10px; border: 1px solid #ddd;">Risk Level</th>
<th style="padding: 10px; border: 1px solid #ddd;">Lock-in Period</th>
</tr>
<tr><td style="padding: 8px; border: 1px solid #ddd;">Fixed Deposit</td><td style="padding: 8px; border: 1px solid #ddd;">7%</td><td style="padding: 8px; border: 1px solid #ddd;">Low</td><td style="padding: 8px; border: 1px solid #ddd;">1 year</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd;">Mutual Fund</td><td style="padding: 8px; border: 1px solid #ddd;">12%</td><td style="padding: 8px; border: 1px solid #ddd;">Medium</td><td style="padding: 8px; border: 1px solid #ddd;">3 years</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd;">Stocks</td><td style="padding: 8px; border: 1px solid #ddd;">18%</td><td style="padding: 8px; border: 1px solid #ddd;">High</td><td style="padding: 8px; border: 1px solid #ddd;">None</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd;">PPF</td><td style="padding: 8px; border: 1px solid #ddd;">7.1%</td><td style="padding: 8px; border: 1px solid #ddd;">Low</td><td style="padding: 8px; border: 1px solid #ddd;">15 years</td></tr>
</table>
<p><strong>Constraints:</strong></p>
<ul>
<li>Maximum 30% in high-risk investments</li>
<li>At least 20% in low-risk investments</li>
<li>Compound interest applies</li>
</ul>
<p><em>Use the calculator/keypad for numerical answers.</em></p>
</div>`;

async function seedIshwar2026() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const existingTest = await MockTest.findOne({ title: 'Ishwar 2026' });
    if (existingTest) {
      await MockTestQuestion.deleteMany({ testPaperId: existingTest._id });
      await MockTest.deleteOne({ _id: existingTest._id });
      console.log('Deleted existing Ishwar 2026 test data');
    }

    const mockTest = new MockTest({
      title: 'Ishwar 2026',
      description: 'Comprehensive mock test with passage-based questions, data interpretation, and calculator-based problems',
      duration: 120,
      totalQuestions: 66,
      totalMarks: 198,
      isFree: true,
      isActive: true,
      isPublished: true,
      publishedAt: new Date(),
      visibility: 'PUBLISHED',
      testType: 'full',
      difficulty: 'Medium',
      negativeMarkPerQuestion: -1,
      sectionTimeConfig: { hasSectionWiseTime: true },
      instructions: {
        general: [
          'Welcome to Ishwar 2026 Mock Test!',
          'This test has 66 questions divided into 3 sections: VARC, DILR, and QA.',
          'Total duration: 120 minutes (40 minutes per section)',
          'MCQ: +3 marks for correct, -1 for incorrect',
          'TITA/Numeric: +3 marks for correct, no negative marking',
          'Use the on-screen calculator for complex calculations',
          'Passages will appear on the left, questions on the right'
        ],
        sectionSpecific: new Map([
          ['VARC', [
            'VARC: 24 questions in 40 minutes',
            'Includes Reading Comprehension and Para Jumbles',
            'TITA questions require typing the answer'
          ]],
          ['DILR', [
            'DILR: 20 questions in 40 minutes',
            'Data sets with tables and charts',
            'Use calculator for complex calculations'
          ]],
          ['QA', [
            'QA: 22 questions in 40 minutes',
            'Covers Arithmetic, Algebra, Geometry',
            'Use on-screen keypad for numeric answers'
          ]]
        ])
      },
      sections: []
    });

    await mockTest.save();
    console.log('Created Mock Test: Ishwar 2026');

    const questions = [];
    let seqNum = 1;

    for (let i = 0; i < 5; i++) {
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'VARC',
        questionType: 'SINGLE_CORRECT_MCQ',
        questionText: [
          'According to the passage, what is the primary challenge in AI development?',
          'Which of the following best describes the current state of AI regulation?',
          'The passage suggests that AI will contribute how much to the global economy?',
          'What percentage of enterprises are expected to adopt AI by 2025?',
          'The author\'s tone towards AI development can best be described as:'
        ][i],
        passage: varcPassage1,
        options: i === 0 ? [
          { label: 'A', value: 'Technical limitations in processing power' },
          { label: 'B', value: 'Balancing innovation with responsible development' },
          { label: 'C', value: 'Lack of funding from governments' },
          { label: 'D', value: 'Insufficient research publications' }
        ] : i === 1 ? [
          { label: 'A', value: 'Governments have comprehensive frameworks in place' },
          { label: 'B', value: 'Regulation is keeping pace with innovation' },
          { label: 'C', value: 'Governments are struggling to develop adequate frameworks' },
          { label: 'D', value: 'No regulation is needed for AI' }
        ] : i === 2 ? [
          { label: 'A', value: '$1.8 trillion' },
          { label: 'B', value: '$15.7 trillion' },
          { label: 'C', value: '$10 trillion' },
          { label: 'D', value: '$5 trillion' }
        ] : i === 3 ? [
          { label: 'A', value: '50%' },
          { label: 'B', value: '60%' },
          { label: 'C', value: '70%' },
          { label: 'D', value: '80%' }
        ] : [
          { label: 'A', value: 'Pessimistic and warning' },
          { label: 'B', value: 'Cautiously optimistic' },
          { label: 'C', value: 'Highly skeptical' },
          { label: 'D', value: 'Completely neutral' }
        ],
        correctOptionIds: [['B', 'C', 'B', 'C', 'B'][i]],
        marks: { positive: 3, negative: -1 },
        difficulty: ['EASY', 'MEDIUM', 'EASY', 'EASY', 'MEDIUM'][i],
        topicTag: 'Reading Comprehension',
        explanation: 'Based on careful reading of the passage about AI development.'
      });
    }

    for (let i = 0; i < 3; i++) {
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'VARC',
        questionType: 'TITA',
        questionText: [
          'Enter the correct sequence of sentences to form a coherent paragraph (e.g., 12345):',
          'Which sentence should come FIRST in the logical sequence? Enter the number:',
          'Which sentence discusses the challenges of remote work? Enter the number:'
        ][i],
        passage: varcPassage2,
        options: [],
        correctOptionIds: [],
        textAnswer: ['15234', '1', '3'][i],
        marks: { positive: 3, negative: 0 },
        difficulty: 'HARD',
        topicTag: 'Para Jumbles',
        explanation: 'Logical sequencing based on cause-effect relationships and transitions.'
      });
    }

    for (let i = 0; i < 16; i++) {
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'VARC',
        questionType: i % 5 === 0 ? 'TITA' : 'SINGLE_CORRECT_MCQ',
        questionText: `VARC Question ${i + 9}: ${['Identify the main argument', 'Find the inference', 'Determine the tone', 'Vocabulary in context', 'Logical conclusion'][i % 5]}`,
        passage: i < 8 ? varcPassage1 : null,
        options: i % 5 !== 0 ? [
          { label: 'A', value: `Option A - VARC Q${i + 9}` },
          { label: 'B', value: `Option B - VARC Q${i + 9}` },
          { label: 'C', value: `Option C - VARC Q${i + 9}` },
          { label: 'D', value: `Option D - VARC Q${i + 9}` }
        ] : [],
        correctOptionIds: i % 5 !== 0 ? [['A', 'B', 'C', 'D'][i % 4]] : [],
        textAnswer: i % 5 === 0 ? String(i + 1) : undefined,
        marks: { positive: 3, negative: i % 5 !== 0 ? -1 : 0 },
        difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3],
        topicTag: i < 8 ? 'Reading Comprehension' : 'Verbal Ability'
      });
    }

    for (let i = 0; i < 6; i++) {
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'DILR',
        questionType: i % 2 === 0 ? 'NUMERIC' : 'SINGLE_CORRECT_MCQ',
        questionText: [
          'What is the total annual sales (in lakhs) for the West region? (Use calculator)',
          'Which region showed the maximum growth from Q1 to Q4?',
          'Calculate the percentage increase in South region from Q1 to Q4. Round to nearest integer.',
          'Which region achieved the yearly target of 1000 lakhs?',
          'What is the average quarterly sales across all regions in Q3?',
          'How many regions showed consistent growth across all quarters?'
        ][i],
        passage: dilrPassage1,
        options: i % 2 !== 0 ? [
          { label: 'A', value: 'North' },
          { label: 'B', value: 'South' },
          { label: 'C', value: 'West' },
          { label: 'D', value: 'Central' }
        ] : [],
        correctOptionIds: i % 2 !== 0 ? [['A', 'B', 'C', 'D'][i % 4]] : [],
        numericAnswer: i === 0 ? 1291 : i === 2 ? 41 : i === 4 ? 251 : undefined,
        marks: { positive: 3, negative: i % 2 !== 0 ? -1 : 0 },
        difficulty: 'MEDIUM',
        topicTag: 'Data Interpretation',
        explanation: 'Calculate from the table data provided.'
      });
    }

    for (let i = 0; i < 6; i++) {
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'DILR',
        questionType: i % 3 === 0 ? 'TITA' : 'SINGLE_CORRECT_MCQ',
        questionText: [
          'How many teams did Team E defeat to win the tournament? Enter the number.',
          'Which team did Team B lose to in the semi-finals?',
          'In which round was Team F eliminated?',
          'Enter the total number of matches played in the tournament.',
          'Who played in the final against Team E?',
          'Which team could have played against Team D in Round 1?'
        ][i],
        passage: dilrPassage2,
        options: i % 3 !== 0 ? [
          { label: 'A', value: ['Team A', 'First Round', 'Team A', 'Team C'][i % 4] },
          { label: 'B', value: ['Team C', 'Quarter Finals', 'Team B', 'Team D'][i % 4] },
          { label: 'C', value: ['Team E', 'Semi Finals', 'Team G', 'Team E'][i % 4] },
          { label: 'D', value: ['Team H', 'Finals', 'Team H', 'Team F'][i % 4] }
        ] : [],
        correctOptionIds: i % 3 !== 0 ? ['C'] : [],
        textAnswer: i === 0 ? '3' : i === 3 ? '7' : undefined,
        marks: { positive: 3, negative: i % 3 !== 0 ? -1 : 0 },
        difficulty: 'HARD',
        topicTag: 'Logical Reasoning',
        explanation: 'Based on tournament bracket analysis.'
      });
    }

    for (let i = 0; i < 8; i++) {
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'DILR',
        questionType: i % 3 === 0 ? 'NUMERIC' : 'SINGLE_CORRECT_MCQ',
        questionText: `DILR Question ${i + 13}: ${['Analyze the data pattern', 'Find the outlier', 'Calculate the ratio', 'Determine the sequence'][i % 4]}`,
        passage: i < 4 ? dilrPassage1 : dilrPassage2,
        options: i % 3 !== 0 ? [
          { label: 'A', value: `Choice A - DI Q${i + 13}` },
          { label: 'B', value: `Choice B - DI Q${i + 13}` },
          { label: 'C', value: `Choice C - DI Q${i + 13}` },
          { label: 'D', value: `Choice D - DI Q${i + 13}` }
        ] : [],
        correctOptionIds: i % 3 !== 0 ? [['A', 'B', 'C', 'D'][i % 4]] : [],
        numericAnswer: i % 3 === 0 ? (100 + i * 15) : undefined,
        marks: { positive: 3, negative: i % 3 !== 0 ? -1 : 0 },
        difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3],
        topicTag: 'Data Interpretation'
      });
    }

    for (let i = 0; i < 6; i++) {
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'QA',
        questionType: 'NUMERIC',
        questionText: [
          'If Rahul invests 30% in stocks, 50% in mutual funds, and rest in FD, what is his expected annual return? (Enter amount in Rs, no decimals)',
          'Calculate the maturity value of Rs. 10,000 in PPF after 15 years. (Round to nearest Rs)',
          'If Rahul invests Rs. 15,000 in stocks and earns 18% annually, what is his profit after 2 years? (Compound interest, round to nearest Rs)',
          'What is the minimum amount Rahul must invest in low-risk options? (Enter in Rs)',
          'If FD rate increases by 1%, how much more will Rahul earn on Rs. 10,000 in one year?',
          'Calculate the weighted average return if Rahul invests equally in all four options.'
        ][i],
        passage: qaPassage1,
        options: [],
        correctOptionIds: [],
        numericAnswer: [6100, 27590, 5724, 10000, 100, 11][i],
        marks: { positive: 3, negative: 0 },
        difficulty: 'HARD',
        topicTag: 'Arithmetic - Interest',
        explanation: 'Use calculator for compound interest and weighted average calculations.'
      });
    }

    for (let i = 0; i < 16; i++) {
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'QA',
        questionType: i % 3 === 0 ? 'NUMERIC' : 'SINGLE_CORRECT_MCQ',
        questionText: i < 5 
          ? `Arithmetic: ${['A train travels 360 km in 6 hours. Find speed in km/h.', 'Find SI on Rs. 8000 at 5% for 3 years.', 'A shopkeeper marks up by 25% and gives 10% discount. Find profit %.', 'Ratio of A:B is 3:4 and B:C is 5:6. Find A:C.', 'Find the LCM of 12, 18, and 24.'][i]}`
          : i < 10
          ? `Algebra: ${['Solve: 3x + 7 = 22. Find x.', 'If x² - 5x + 6 = 0, find sum of roots.', 'Simplify: (a+b)² - (a-b)²', 'Find value of x: 2^x = 64', 'If f(x) = x² + 2x, find f(3).'][i-5]}`
          : `Geometry: ${['Find area of triangle with base 12cm and height 8cm.', 'Perimeter of a rectangle is 40cm. If length is 12cm, find area.', 'Find circumference of circle with diameter 14cm. (Use π=22/7)', 'Volume of cube with side 5cm.', 'Find diagonal of square with side 10cm.', 'Area of circle with radius 7cm. (Use π=22/7)'][i-10]}`,
        options: i % 3 !== 0 ? [
          { label: 'A', value: `${(i + 5) * 3}` },
          { label: 'B', value: `${(i + 5) * 4}` },
          { label: 'C', value: `${(i + 5) * 5}` },
          { label: 'D', value: `${(i + 5) * 6}` }
        ] : [],
        correctOptionIds: i % 3 !== 0 ? [['A', 'B', 'C', 'D'][i % 4]] : [],
        numericAnswer: i % 3 === 0 ? [60, 1200, 5, 72, 48, 15, 96, 44, 125, 14, 154][Math.floor(i / 3)] : undefined,
        marks: { positive: 3, negative: i % 3 !== 0 ? -1 : 0 },
        difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3],
        topicTag: i < 5 ? 'Arithmetic' : i < 10 ? 'Algebra' : 'Geometry'
      });
    }

    const savedQuestions = await MockTestQuestion.insertMany(questions);
    console.log(`Created ${savedQuestions.length} questions`);

    const varcQuestions = savedQuestions.filter(q => q.section === 'VARC').map(q => q._id);
    const dilrQuestions = savedQuestions.filter(q => q.section === 'DILR').map(q => q._id);
    const qaQuestions = savedQuestions.filter(q => q.section === 'QA').map(q => q._id);

    mockTest.sections = [
      {
        name: 'VARC',
        duration: 40,
        totalQuestions: varcQuestions.length,
        totalMarks: varcQuestions.length * 3,
        questions: varcQuestions
      },
      {
        name: 'DILR',
        duration: 40,
        totalQuestions: dilrQuestions.length,
        totalMarks: dilrQuestions.length * 3,
        questions: dilrQuestions
      },
      {
        name: 'QA',
        duration: 40,
        totalQuestions: qaQuestions.length,
        totalMarks: qaQuestions.length * 3,
        questions: qaQuestions
      }
    ];

    mockTest.totalQuestions = savedQuestions.length;
    mockTest.totalMarks = savedQuestions.length * 3;
    await mockTest.save();

    console.log('\n========================================');
    console.log('   ISHWAR 2026 Mock Test Created!');
    console.log('========================================');
    console.log(`Test Name: ${mockTest.title}`);
    console.log(`Total Questions: ${savedQuestions.length}`);
    console.log(`Duration: 120 minutes`);
    console.log('----------------------------------------');
    console.log(`VARC: ${varcQuestions.length} questions`);
    console.log(`DILR: ${dilrQuestions.length} questions`);
    console.log(`QA: ${qaQuestions.length} questions`);
    console.log('----------------------------------------');
    console.log('Question Types:');
    console.log(`  MCQ: ${savedQuestions.filter(q => q.questionType === 'SINGLE_CORRECT_MCQ').length}`);
    console.log(`  TITA: ${savedQuestions.filter(q => q.questionType === 'TITA').length}`);
    console.log(`  NUMERIC (Calculator): ${savedQuestions.filter(q => q.questionType === 'NUMERIC').length}`);
    console.log('----------------------------------------');
    console.log(`Passage-based: ${savedQuestions.filter(q => q.passage).length}`);
    console.log(`Mock Test ID: ${mockTest._id}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Error seeding Ishwar 2026:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedIshwar2026();
