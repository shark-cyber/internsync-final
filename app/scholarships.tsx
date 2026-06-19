import Feed from '../src/components/Feed';
import { scholarships } from '../src/data/feed';
export default function Scholarships() { return <Feed data={scholarships} accent="scholarship" current="/scholarships" />; }
