import { Accent } from '../theme';

export type Opportunity = {
  tag: string;
  title: string;
  meta: string;
  pay: string;
  chips: string[];
  desc: string;
  img?: any; // require(...) for a photo, else undefined -> gradient
};

export const internships: Opportunity[] = [
  {
    tag: 'Internship', title: 'Software Engineer Intern', meta: 'Linear · Jakarta, ID',
    pay: '$50 – $75 / mo', chips: ['Full-time', 'Remote', 'Senior'],
    desc: 'Build and ship features across the product. Work with designers and engineers to plan, execute, and monitor projects end to end.',
    img: require('../../assets/img/job1.jpg'),
  },
  {
    tag: 'Internship', title: 'Product Designer Intern', meta: 'Figma · Remote',
    pay: '$45 – $65 / mo', chips: ['Full-time', 'Remote', 'Mid'],
    desc: 'Craft polished UI and flows for new product surfaces, partnering with researchers and engineers to ship usable experiences.',
  },
  {
    tag: 'Internship', title: 'Data Analyst Intern', meta: 'Stripe · Remote',
    pay: '$50 – $70 / mo', chips: ['Full-time', 'Hybrid', 'Mid'],
    desc: 'Turn raw data into clear answers — build dashboards, dig into trends, and help teams make better decisions.',
  },
  {
    tag: 'Internship', title: 'Marketing Intern', meta: 'Notion · Canada',
    pay: '$40 – $55 / mo', chips: ['Part-time', 'On-site', 'Junior'],
    desc: 'Support campaigns across channels, draft copy, and help measure what works for a creative, data-curious self-starter.',
  },
];

export const scholarships: Opportunity[] = [
  {
    tag: 'Scholarship', title: 'Global Leaders Scholarship', meta: 'Gates Foundation · Worldwide',
    pay: '$10,000 / year', chips: ['Merit-based', 'Undergraduate', 'Global'],
    desc: 'A fully funded award for high-achieving undergraduates, covering tuition and an annual living stipend.',
    img: require('../../assets/img/scholarship1.jpg'),
  },
  {
    tag: 'Scholarship', title: 'STEM Excellence Grant', meta: 'NSF · United States',
    pay: '$7,500 / year', chips: ['Merit-based', 'STEM', 'Research'],
    desc: 'Supports undergraduates in STEM with funding, mentorship, and a research placement.',
  },
  {
    tag: 'Scholarship', title: 'Future Founders Fund', meta: 'Kauffman · Remote',
    pay: '$5,000 / year', chips: ['Need-based', 'Entrepreneurship'],
    desc: 'For students building ventures — covers fees and connects you with founder mentors.',
  },
];

export const extracurriculars: Opportunity[] = [
  {
    tag: 'Extracurricular', title: 'Robotics Club', meta: 'City College · Jakarta, ID',
    pay: 'Free · 4 hrs / week', chips: ['Team', 'Weekly', 'Beginner friendly'],
    desc: 'Design, build, and program competition robots with a friendly team. All skill levels welcome.',
    img: require('../../assets/img/extra1.jpg'),
  },
  {
    tag: 'Extracurricular', title: 'Debate Society', meta: 'City College · Jakarta, ID',
    pay: 'Free · Weekly', chips: ['Team', 'Weekly', 'All levels'],
    desc: 'Sharpen argument and public-speaking skills through weekly debates and tournaments.',
  },
  {
    tag: 'Extracurricular', title: 'Volunteer Corps', meta: 'Community · On-site',
    pay: 'Free · Flexible', chips: ['Volunteer', 'Flexible'],
    desc: 'Give back through local projects — flexible hours and a great way to build experience.',
  },
];

export type Status = 'accepted' | 'review' | 'rejected' | 'confirmed';
export type Application = {
  title: string; org: string; applied: string; status: Status;
  tags: string[]; pay: string; joining?: string; letter?: string; img?: any;
  desc: string; reqs: string[];
};

export const applications: Application[] = [
  { title: 'Software Engineer Intern', org: 'Linear · Jakarta, ID', applied: 'Applied May 02', status: 'accepted',
    tags: ['Full-time', 'Remote', 'Senior'], pay: '$50 – $75 / month', joining: '02 Jun 2025', img: require('../../assets/img/job1.jpg'),
    desc: 'Help plan, build, and ship features end to end alongside designers and engineers.',
    reqs: ['Strong JS / TypeScript', 'Comfort across the stack', 'An eye for clean UI', 'Collaborative mindset'] },
  { title: 'Product Design Intern', org: 'Figma · Remote', applied: 'Applied Apr 18', status: 'review', letter: 'F',
    tags: ['Full-time', 'Remote', 'Mid'], pay: '$45 – $65 / month',
    desc: 'Craft flows and polished UI for new product surfaces.',
    reqs: ['Strong portfolio', 'Figma fluency', 'Interaction fundamentals', 'Clear communication'] },
  { title: 'UX Research Intern', org: 'Spotify · Remote', applied: 'Applied Mar 02', status: 'accepted', letter: 'S',
    tags: ['Full-time', 'Remote', 'Junior'], pay: '$45 – $60 / month', joining: '09 Jun 2025',
    desc: 'Run studies that shape product direction from plan to insight.',
    reqs: ['Qual & quant methods', 'Strong synthesis', 'Empathy for users', 'Self-directed'] },
  { title: 'Marketing Intern', org: 'Notion · Canada', applied: 'Applied Feb 26', status: 'review', letter: 'N',
    tags: ['Full-time', 'Offsite', 'Junior'], pay: '$40 – $55 / month',
    desc: 'Support campaigns, draft copy, and measure what works.',
    reqs: ['Sharp writing', 'Analytics basics', 'Creative & organised', 'Interest in growth'] },
  { title: 'Data Analyst Intern', org: 'Stripe · Remote', applied: 'Applied Mar 10', status: 'rejected', letter: 'St',
    tags: ['Full-time', 'Remote', 'Mid'], pay: '$50 – $70 / month',
    desc: 'Turn raw data into clear answers and dashboards.',
    reqs: ['SQL + scripting', 'Data viz tools', 'Statistical reasoning', 'Clear reporting'] },
];

export type Saved = { title: string; sub: string; cat: Accent; letter?: string; img?: any; pay: string; desc: string };
export const savedItems: Saved[] = [
  { title: 'Software Engineer Intern', sub: 'Internship · Linear', cat: 'internship', img: require('../../assets/img/job1.jpg'), pay: '$50 – $75 / mo', desc: 'Build and ship features across the product, from idea to launch.' },
  { title: 'Global Leaders Scholarship', sub: 'Scholarship · Gates Foundation', cat: 'scholarship', img: require('../../assets/img/scholarship1.jpg'), pay: '$10,000 / year', desc: 'A fully funded award covering tuition and a yearly stipend.' },
  { title: 'Robotics Club', sub: 'Extracurricular · City College', cat: 'extracurricular', img: require('../../assets/img/extra1.jpg'), pay: 'Free · 4 hrs / week', desc: 'Design, build, and program competition robots with a friendly team.' },
  { title: 'Product Design Intern', sub: 'Internship · Figma', cat: 'internship', letter: 'F', pay: '$45 – $65 / mo', desc: 'Craft polished UI and flows for new product surfaces.' },
  { title: 'STEM Excellence Grant', sub: 'Scholarship · NSF', cat: 'scholarship', letter: 'N', pay: '$7,500 / year', desc: 'Supports undergraduates in STEM with funding and mentorship.' },
];

export type Notif = { t: string; s: string; time: string; unread: boolean };
export const notifications: Notif[] = [
  { t: "You're accepted!", s: 'Linear · Software Engineer Intern', time: '2h', unread: true },
  { t: 'Application viewed', s: 'Figma · Product Designer Intern', time: '1d', unread: true },
  { t: 'New matches for you', s: '3 internships in Design', time: '2d', unread: false },
];
