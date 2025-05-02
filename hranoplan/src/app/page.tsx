export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-[#222]">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold mb-4 text-center text-[#2E5E4E]">
          Храноплан
        </h1>
        <p className="text-lg text-center max-w-2xl mb-8 text-gray-700">
          Вашият личен асистент за хранително планиране, който ви помага да
          организирате и приготвяте седмичните си ястия с лекота.
        </p>
        <form action="/plan" className="w-full flex justify-center">
          <button
            className="bg-[#2E5E4E] hover:bg-[#21806A] text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg shadow"
            type="submit"
          >
            Започнете планиране
          </button>
        </form>
      </div>
    </main>
  );
}
