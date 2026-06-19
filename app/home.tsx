import Feed from '../src/components/Feed';
import { internships } from '../src/data/feed';
export default function Home() { return <Feed data={internships} accent="internship" current="/home" />; }
