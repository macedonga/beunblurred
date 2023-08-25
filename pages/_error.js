import { useRouter } from "next/router";

function Error({ statusCode }) {
    const router = useRouter();

    return (<>
        <h1 className="text-3xl font-semibold text-center">
            Error {statusCode}
        </h1>
        <p className="text-center mt-2">
            {statusCode === 404
                ? `Looks like this page doesn't exist.`
                : statusCode === 500
                    ? `Looks like something went wrong on the server side. Try logging out and logging back in.`
                    : `An error occurred on client`}
        </p>

        <button
                className={`
                        px-4 py-2 bg-white/5 rounded-lg transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed mt-2
                        focus:ring-2 focus:ring-white/20 outline-none
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
