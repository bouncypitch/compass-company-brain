import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Compass',
  description: 'The company brain that turns market moves into roadmaps and promotions.',
};

/** The root opens the Compass demo (which sends signed-out visitors to log in first). */
export default function HomePage() {
  redirect('/demo');
}
