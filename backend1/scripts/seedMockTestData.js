const mongoose = require('mongoose');
const MockTest = require('../models/MockTest');
const MockTestQuestion = require('../models/MockTestQuestion');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const varcPassage1 = `<p><strong>Passage:</strong></p>
<p>Oftentimes, when economists cross borders, they are less interested in learning from others than in invading their garden plots. Gary Becker, for instance, pioneered the idea of human capital. To do so, he famously tackled topics like crime and domesticity, applying methods honed in the study of markets to domains of nonmarket life. He projected economics outward into new realms: for example, by revealing the extent to which humans calculate marginal utilities when choosing their spouses or stealing from neighbors. At the same time, he did not let other ways of thinking enter his own economic realm: for example, he did not borrow from anthropology or history or let observations of nonmarket economics inform his homo economicus. Becker was a picture of the imperial economist in the heyday of the discipline's bravura.</p>
<p>Times have changed for the once almighty discipline. Economics has been taken to task, within and beyond its ramparts. Some economists have reached out, imported, borrowed, and collaborated—been less imperial, more open. Consider Thomas Piketty and his outreach to historians. The booming field of behavioral economics—the fusion of economics and social psychology—is another case. Having spawned active subfields, like judgment, decision-making and a turn to experimentation, the field aims to go beyond the caricature of Rational Man to explain how humans make decisions.</p>
<p>It is important to underscore how this flips the way we think about economics. For generations, economics styled itself as the master social science, a kind of physics of human affairs. Less rigorous fields were meant to import methods from more formal disciplines. Sociologists, anthropologists, and political scientists borrowed models, math, and methods from economists. If there was trade between economics and adjacent fields, it was largely a one-way flow.</p>`;

const varcPassage2 = `<p><strong>Passage:</strong></p>
<p>Five jumbled up sentences (labelled 1, 2, 3, 4 and 5), related to a topic, are given below. Four of them can be put together to form a coherent paragraph. Identify the odd sentence and key in the number of the sentence as your answer.</p>
<p>1. Urbanites also have more and better options for getting around: Uber is ubiquitous; easy-to-rent dockless bicycles are spreading; battery-powered scooters will be next.</p>
<p>2. When more people use buses or trains the service usually improves because public-transport agencies run more buses and trains.</p>
<p>3. Worsening services on public transport, terrorist attacks in some urban metros and a rise in fares have been blamed for this trend.</p>
<p>4. It seems more likely that public transport is being squeezed structurally as people's need to travel is diminishing as a result of smartphones, video-conferencing, online shopping and so on.</p>
<p>5. There has been a puzzling decline in the use of urban public transport in many countries in the west, despite the growth in urban populations and rising employment.</p>`;

const dilrPassage1 = `<p><strong>Data Interpretation Set:</strong></p>
<p>The temperature outside has been falling at a constant rate from 7 pm onward until 3 am on a particular night. The following graph shows the inside temperature between 11 pm (23:00) and 2 am (2:00) that night.</p>
<p>If the AC is switched off, then the inside temperature rises at a constant rate so as to reach the temperature outside at the time of switching off in 1 hour.</p>
<p>Additional Information:</p>
<ul>
<li>The AC was switched on at 11 pm when inside temperature was 38°C</li>
<li>When AC is on, inside temperature drops by 2°C every 30 minutes</li>
<li>Outside temperature at 11 pm was 32°C</li>
<li>Outside temperature drops by 1°C every hour</li>
</ul>
<p><em>[Graph shows inside temperature: 38°C at 23:00, dropping to 32°C at 23:30, then fluctuating between 28-32°C until 2:00]</em></p>`;

const qaPassage1 = `<p><strong>Quantitative Aptitude Set:</strong></p>
<p>A company has three manufacturing units A, B and C. The following information is available:</p>
<ul>
<li>Unit A produces 40% of total output</li>
<li>Unit B produces 35% of total output</li>
<li>Unit C produces remaining output</li>
<li>Defective rate at A is 2%</li>
<li>Defective rate at B is 3%</li>
<li>Defective rate at C is 4%</li>
</ul>
<p>Answer the following questions based on this information.</p>`;

async function seedMockTestData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const existingTest = await MockTest.findOne({ title: 'CAT 2025 Mock Exam' });
    if (existingTest) {
      await MockTestQuestion.deleteMany({ testPaperId: existingTest._id });
      await MockTest.deleteOne({ _id: existingTest._id });
      console.log('Deleted existing CAT 2025 Mock Exam data');
    }

    const mockTest = new MockTest({
      title: 'CAT 2025 Mock Exam',
      description: 'Full-length CAT mock test with VARC, DILR, and QA sections',
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
          'This is a CAT 2025 Mock Test with 66 questions divided into 3 sections.',
          'Total time: 120 minutes (40 minutes per section)',
          'Each correct answer carries 3 marks. Wrong answer in MCQ carries -1 mark.',
          'TITA questions have no negative marking.',
          'You can navigate between questions within a section.',
          'Once you move to next section, you cannot go back to previous section.'
        ],
        sectionSpecific: new Map([
          ['VARC', [
            'VARC section has 24 questions to be attempted in 40 minutes.',
            'Reading Comprehension passages will have 4-5 questions each.',
            'Para jumbles and odd sentence questions are TITA type.'
          ]],
          ['DILR', [
            'DILR section has 20 questions to be attempted in 40 minutes.',
            'Sets of 4-6 questions are based on common data/graphs.',
            'Both MCQ and TITA type questions are present.'
          ]],
          ['QA', [
            'QA section has 22 questions to be attempted in 40 minutes.',
            'Questions cover Arithmetic, Algebra, Geometry, and Number Systems.',
            'TITA type questions have no negative marking.'
          ]]
        ])
      },
      sections: []
    });

    await mockTest.save();
    console.log('Created Mock Test:', mockTest.title);

    const questions = [];
    let seqNum = 1;

    for (let i = 0; i < 4; i++) {
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'VARC',
        questionType: 'SINGLE_CORRECT_MCQ',
        questionText: i === 0 
          ? 'In the first paragraph the author is making the point that economists like Becker'
          : i === 1
          ? 'According to the passage, which of the following best describes the change in economics?'
          : i === 2
          ? 'The phrase "imperial economist" in the passage refers to economists who'
          : 'The main purpose of the passage is to',
        passage: varcPassage1,
        options: i === 0 ? [
          { label: 'A', value: 'benefitted from the application of their principles and concepts to non-economic phenomena.' },
          { label: 'B', value: 'had begun to borrow concepts from other disciplines but were averse to the latter applying economic principles.' },
          { label: 'C', value: 'used economics to analyse non-market behaviour, without incorporating perspectives from other areas of inquiry.' },
          { label: 'D', value: 'tended to guard their discipline from poaching by academics from other subject areas.' }
        ] : i === 1 ? [
          { label: 'A', value: 'Economics has become more interdisciplinary and collaborative.' },
          { label: 'B', value: 'Economics has lost its scientific rigor.' },
          { label: 'C', value: 'Economics has become less relevant to modern society.' },
          { label: 'D', value: 'Economics has rejected all behavioral insights.' }
        ] : i === 2 ? [
          { label: 'A', value: 'were critical of other social sciences.' },
          { label: 'B', value: 'applied economic methods to other fields without borrowing from them.' },
          { label: 'C', value: 'worked in developing countries.' },
          { label: 'D', value: 'believed in free market policies.' }
        ] : [
          { label: 'A', value: 'to criticize Gary Becker\'s approach to economics.' },
          { label: 'B', value: 'to describe changes in how economics interacts with other disciplines.' },
          { label: 'C', value: 'to advocate for more rigorous economic methods.' },
          { label: 'D', value: 'to explain the history of behavioral economics.' }
        ],
        correctOptionIds: [i === 0 ? 'C' : i === 1 ? 'A' : i === 2 ? 'B' : 'B'],
        marks: { positive: 3, negative: -1 },
        difficulty: 'MEDIUM',
        topicTag: 'Reading Comprehension',
        explanation: 'This question tests your understanding of the passage\'s main argument about how economists have historically approached other disciplines.'
      });
    }

    for (let i = 0; i < 4; i++) {
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'VARC',
        questionType: i < 2 ? 'SINGLE_CORRECT_MCQ' : 'TITA',
        questionText: i === 0
          ? 'Which sentence does NOT fit with the other four to form a coherent paragraph?'
          : i === 1
          ? 'What is the central theme of this paragraph jumble?'
          : i === 2
          ? 'Enter the number of the odd sentence (1-5):'
          : 'Based on logical sequence, which sentence should come first? Enter the number:',
        passage: varcPassage2,
        options: i === 0 ? [
          { label: 'A', value: 'Sentence 1' },
          { label: 'B', value: 'Sentence 2' },
          { label: 'C', value: 'Sentence 3' },
          { label: 'D', value: 'Sentence 4' }
        ] : i === 1 ? [
          { label: 'A', value: 'The growth of urban transportation' },
          { label: 'B', value: 'The decline in public transport usage' },
          { label: 'C', value: 'The rise of new transportation technologies' },
          { label: 'D', value: 'Environmental impact of urban transport' }
        ] : [],
        correctOptionIds: i === 0 ? ['B'] : i === 1 ? ['B'] : [],
        textAnswer: i === 2 ? '2' : i === 3 ? '5' : undefined,
        marks: { positive: 3, negative: i < 2 ? -1 : 0 },
        difficulty: i < 2 ? 'MEDIUM' : 'HARD',
        topicTag: 'Para Jumbles',
        explanation: 'Sentence 2 is about a general principle of public transport improvement which doesn\'t fit the context of declining usage.'
      });
    }

    for (let i = 0; i < 16; i++) {
      const isPassageBased = i < 8;
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'VARC',
        questionType: i % 4 === 3 ? 'TITA' : 'SINGLE_CORRECT_MCQ',
        questionText: isPassageBased 
          ? `Reading Comprehension Question ${i + 1}: Based on the passage, what inference can be drawn about the author's viewpoint?`
          : `Verbal Ability Question ${i - 7}: Choose the correct option.`,
        passage: isPassageBased ? varcPassage1 : null,
        options: i % 4 !== 3 ? [
          { label: 'A', value: `Option A for VARC question ${i + 9}` },
          { label: 'B', value: `Option B for VARC question ${i + 9}` },
          { label: 'C', value: `Option C for VARC question ${i + 9}` },
          { label: 'D', value: `Option D for VARC question ${i + 9}` }
        ] : [],
        correctOptionIds: i % 4 !== 3 ? [['A', 'B', 'C', 'D'][i % 4]] : [],
        textAnswer: i % 4 === 3 ? String(Math.floor(Math.random() * 5) + 1) : undefined,
        marks: { positive: 3, negative: i % 4 !== 3 ? -1 : 0 },
        difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3],
        topicTag: isPassageBased ? 'Reading Comprehension' : 'Verbal Ability'
      });
    }

    for (let i = 0; i < 4; i++) {
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'DILR',
        questionType: i % 2 === 0 ? 'TITA' : 'SINGLE_CORRECT_MCQ',
        questionText: i === 0 
          ? 'What was the temperature outside, in degree Celsius, at 1 am?'
          : i === 1
          ? 'At what time was the AC first switched off?'
          : i === 2
          ? 'What was the inside temperature (in °C) at midnight (0:00)?'
          : 'For how many minutes was the AC continuously ON after 11:30 pm?',
        passage: dilrPassage1,
        options: i % 2 === 0 ? [] : [
          { label: 'A', value: '11:30 pm' },
          { label: 'B', value: '12:00 am' },
          { label: 'C', value: '12:30 am' },
          { label: 'D', value: '1:00 am' }
        ],
        correctOptionIds: i % 2 === 0 ? [] : ['C'],
        numericAnswer: i === 0 ? 30 : i === 2 ? 32 : undefined,
        marks: { positive: 3, negative: i % 2 === 0 ? 0 : -1 },
        difficulty: 'HARD',
        topicTag: 'Data Interpretation',
        explanation: 'Based on the graph and given information about temperature changes.'
      });
    }

    for (let i = 0; i < 16; i++) {
      const isSetBased = i < 8;
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'DILR',
        questionType: i % 3 === 0 ? 'NUMERIC' : 'SINGLE_CORRECT_MCQ',
        questionText: isSetBased
          ? `DILR Set Question ${i + 1}: Based on the data provided, calculate the required value.`
          : `Logical Reasoning Question ${i - 7}: Analyze the given information and select the correct answer.`,
        passage: isSetBased ? dilrPassage1 : null,
        options: i % 3 !== 0 ? [
          { label: 'A', value: `Choice A for DILR Q${i + 5}` },
          { label: 'B', value: `Choice B for DILR Q${i + 5}` },
          { label: 'C', value: `Choice C for DILR Q${i + 5}` },
          { label: 'D', value: `Choice D for DILR Q${i + 5}` }
        ] : [],
        correctOptionIds: i % 3 !== 0 ? [['A', 'B', 'C', 'D'][i % 4]] : [],
        numericAnswer: i % 3 === 0 ? (i + 10) * 2 : undefined,
        marks: { positive: 3, negative: i % 3 !== 0 ? -1 : 0 },
        difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3],
        topicTag: isSetBased ? 'Data Interpretation' : 'Logical Reasoning'
      });
    }

    for (let i = 0; i < 4; i++) {
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'QA',
        questionType: i % 2 === 0 ? 'NUMERIC' : 'SINGLE_CORRECT_MCQ',
        questionText: i === 0 
          ? 'If a randomly selected item is found to be defective, what is the probability (in %) that it was produced by Unit A? Enter your answer rounded to the nearest integer.'
          : i === 1
          ? 'What is the overall defective rate of the company?'
          : i === 2
          ? 'If 1000 items are produced, how many defective items are expected from Unit B? Enter exact number.'
          : 'Which unit has the highest contribution to defective items?',
        passage: qaPassage1,
        options: i % 2 === 0 ? [] : i === 1 ? [
          { label: 'A', value: '2.8%' },
          { label: 'B', value: '2.85%' },
          { label: 'C', value: '3.0%' },
          { label: 'D', value: '3.15%' }
        ] : [
          { label: 'A', value: 'Unit A' },
          { label: 'B', value: 'Unit B' },
          { label: 'C', value: 'Unit C' },
          { label: 'D', value: 'All equal' }
        ],
        correctOptionIds: i === 1 ? ['B'] : i === 3 ? ['B'] : [],
        numericAnswer: i === 0 ? 28 : i === 2 ? 11 : undefined,
        marks: { positive: 3, negative: i % 2 === 0 ? 0 : -1 },
        difficulty: 'HARD',
        topicTag: 'Probability',
        explanation: 'Using Bayes theorem and basic probability calculations.'
      });
    }

    for (let i = 0; i < 18; i++) {
      questions.push({
        testPaperId: mockTest._id,
        sequenceNumber: seqNum++,
        section: 'QA',
        questionType: i % 3 === 0 ? 'NUMERIC' : 'SINGLE_CORRECT_MCQ',
        questionText: i < 6 
          ? `Arithmetic Question ${i + 1}: ${['Calculate the simple interest on Rs. 5000 at 8% p.a. for 3 years.', 'A train travels at 60 km/h. How far does it travel in 2.5 hours?', 'Find the average of 12, 18, 24, 30, and 36.', 'If the ratio of A to B is 3:5, and B is 40, find A.', 'A shopkeeper offers 20% discount on MRP of Rs. 500. Find selling price.', 'Calculate compound interest on Rs. 10000 at 10% for 2 years.'][i]}`
          : i < 12
          ? `Algebra Question ${i - 5}: ${['Solve for x: 2x + 5 = 17', 'Find the value of x in: x² - 9 = 0 (positive root)', 'If 3a + 2b = 12 and a = 2, find b.', 'Simplify: (x² - 4)/(x - 2) for x ≠ 2', 'Find the sum of roots of x² - 7x + 12 = 0', 'If f(x) = 2x + 3, find f(5).'][i - 6]}`
          : `Geometry/Number System Question ${i - 11}: ${['Find the area of a circle with radius 7 cm. (Use π = 22/7)', 'What is the perimeter of a square with side 15 cm?', 'Find the HCF of 24 and 36.', 'What is the LCM of 12 and 18?', 'Find the sum of first 10 natural numbers.', 'How many prime numbers are between 1 and 20?'][i - 12]}`,
        options: i % 3 !== 0 ? [
          { label: 'A', value: `${(i + 2) * 10}` },
          { label: 'B', value: `${(i + 3) * 10}` },
          { label: 'C', value: `${(i + 4) * 10}` },
          { label: 'D', value: `${(i + 5) * 10}` }
        ] : [],
        correctOptionIds: i % 3 !== 0 ? [['A', 'B', 'C', 'D'][i % 4]] : [],
        numericAnswer: i % 3 === 0 ? [1200, 150, 24, 400, 2100, 6, 3, 3, 154, 60, 12, 36, 55, 8][Math.floor(i / 3)] : undefined,
        marks: { positive: 3, negative: i % 3 !== 0 ? -1 : 0 },
        difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3],
        topicTag: i < 6 ? 'Arithmetic' : i < 12 ? 'Algebra' : 'Geometry & Numbers'
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

    console.log('\n=== Seed Data Summary ===');
    console.log(`Test: ${mockTest.title}`);
    console.log(`Total Questions: ${savedQuestions.length}`);
    console.log(`VARC: ${varcQuestions.length} questions`);
    console.log(`DILR: ${dilrQuestions.length} questions`);
    console.log(`QA: ${qaQuestions.length} questions`);
    console.log('\nQuestion Types:');
    console.log(`  MCQ: ${savedQuestions.filter(q => q.questionType === 'SINGLE_CORRECT_MCQ').length}`);
    console.log(`  TITA: ${savedQuestions.filter(q => q.questionType === 'TITA').length}`);
    console.log(`  NUMERIC: ${savedQuestions.filter(q => q.questionType === 'NUMERIC').length}`);
    console.log(`\nPassage-based questions: ${savedQuestions.filter(q => q.passage).length}`);
    console.log('\nMock Test ID:', mockTest._id);
    console.log('========================\n');

    console.log('Seed data created successfully!');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedMockTestData();
