import { useRouter } from "next/router";
import { T } from "@tolgee/react";

export default function Error({ statusCode }) {
    const router = useRouter();

    return (<>
        <h1 className="text-3xl font-semibold text-center">
            <T keyName="error404Title" />
        </h1>
        <p className="text-center mt-2">
            <T keyName="error404Desc" />
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
            <T keyName="backToFeed" />
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
            <T keyName="logOut" />
        </button>
    </>);
}