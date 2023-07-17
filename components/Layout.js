import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children }) {
    return (<>
        <div
            className={`
                flex flex-col overflow-auto w-full
                max-w-xl mx-auto ${inter.className}
            `}
        >
            <header className="py-8 border-b-2 lg:border-x-2 border-white/10 bg-[#0d0d0d]">
                <h1 className="text-4xl font-bold text-center">
                    BeUnblurred.
                </h1>
            </header>

            <main className="lg:p-8 p-4 pb-0">
                {children}
            </main>
        </div>

        <footer
            className={`
                    sticky bottom-0 max-w-xl mx-auto w-full bg-[#0d0d0d]
                    py-8 lg:px-8 px-4 text-sm text-center
                    border-t-2 lg:border-x-2 border-white/10 mt-auto ${inter.className}
                `}
        >
            <p>
                <b>This site is in no way affiliated with BeReal SAS.</b>
                <br />
                This is a school project made by{" "}
                <a
                    href="https://marco.win"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dashed hover:opacity-75 transition-all"
                >
                    Marco Ceccon
                </a>.
            </p>
        </footer>
    </>);
}