import { useRouter } from "next/router";

function Error({ statusCode }) {
    const router = useRouter();

    return (<>
        <h1 className="text-3xl font-semibold text-center">
            Error 500
        </h1>
        <p className="text-center mt-2">
            Looks like something went wrong on the server side.
            <br />
            This usually means that your token cookie has expired, and it couldn't be refreshed.
            <br />
            Try logging out and logging back in.
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

Error.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404
    return { statusCode }
}

export default Error;
