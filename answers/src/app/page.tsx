import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/questions/new');
}
