import Feed from '../src/components/Feed';
import { extracurriculars } from '../src/data/feed';
export default function Extracurriculars() { return <Feed data={extracurriculars} accent="extracurricular" current="/extracurriculars" />; }
