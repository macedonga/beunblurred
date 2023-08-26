import { useRouter } from "next/router";

export default function Error({ statusCode }) {
    const router = useRouter();

    return (<>
        <h1 className="text-3xl font-semibold text-center">
            Error 404
        </h1>
        <p className="text-center mt-2">
            Looks like this page doesn't exist.
        </p>

        <button
            className={`
                flex bg-white/5 mt-4
                relative border-2 border-white/10
                rounded-lg px-4 py-2 min-w-0 justify-center
                text-white/75 font-medium w-full
            `}
            onClick={() => router.push("/feed")}
        >
            Go to feed
        </button>

        <button
            className={`
                flex bg-white/5 mt-4
                relative border-2 border-white/10
                rounded-lg px-4 py-2 min-w-0 justify-center
                text-white/75 font-medium w-full
            `}
            onClick={() => router.push("/logout")}
        >
            Logout
        </button>
    </>);
}