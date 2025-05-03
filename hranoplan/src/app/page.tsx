export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-gray-50 text-[#222]">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold mb-4 text-center text-[#2E5E4E]">
          Храноплан
        </h1>
        <div className="space-y-6 text-center">
          <p className="text-lg text-gray-700">
            Хранопланът е модерен подход към организирането на хранителния
            режим, който ви позволява да планирате и приготвяте ястията си
            предварително.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-[#2E5E4E] mb-2">
                🎯 Предимства
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Спестяване на време през седмицата</li>
                <li>По-добър контрол върху хранителния режим</li>
                <li>Намаляване на хранителните отпадъци</li>
                <li>По-икономично хранене</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-[#2E5E4E] mb-2">
                ✨ Как работи
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Планиране на менюто за седмицата</li>
                <li>Приготвяне на ястията предварително</li>
                <li>Правилно съхранение в хладилник</li>
                <li>Бързо и лесно сервиране</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-gray-500 italic">Изпробвайте безплатно</p>
        </div>
        <form action="/plan" className="w-full flex justify-center mt-8">
          <button
            className="bg-[#2E5E4E] hover:bg-[#21806A] text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg shadow hover:shadow-lg transform hover:-translate-y-0.5"
            type="submit"
          >
            Започнете планиране
          </button>
        </form>
      </div>
    </main>
  );
}
