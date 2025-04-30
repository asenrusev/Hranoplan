export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4 text-center">
        Welcome to Hranoplan
      </h1>
      <p className="text-lg text-center max-w-2xl mb-8 text-gray-600 dark:text-gray-300">
        Your personal meal prep assistant that helps you plan, organize, and
        prepare your weekly meals with ease.
      </p>
      <form action="/plan">
        <button
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          type="submit"
        >
          Let&apos;s meal prep
        </button>
      </form>
    </main>
  );
}
