import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { hasCookie } from "cookies-next";

import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function Login() {
  const router = useRouter();

  const verifyOtpButtonRef = useRef(null);
  const [Loading, setLoading] = useState(false);
  const [LoginData, setLoginData] = useState({
    phoneNumber: "",
    showCodeInput: false,
    requestId: null,
    otp: []
  });

  const requestFire = async () => {
    const res = await fetch("/api/fire/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone: LoginData.phoneNumber
      })
    });

    if (res.status !== 200) throw new Error("Internal server error");

    const data = await res.json();
    if (!data.success) throw new Error("Internal server error");

    return {
      ...data,
      type: "fire"
    };
  };

  const requestVonage = async () => {
    const res = await fetch("/api/vonage/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone: LoginData.phoneNumber
      })
    });

    if (res.status !== 200) throw new Error("Internal server error");

    const data = await res.json();
    if (!data.success) throw new Error("Internal server error");

    return {
      ...data,
      type: "vonage"
    };
  };

  const requestOTP = async () => {
    setLoading(true);
    if (!isValidPhoneNumber(LoginData.phoneNumber)) return alert("Invalid phone number");

    try {
      const data = await requestFire();

      setLoginData({
        ...LoginData,
        showCodeInput: true,
        requestId: data.requestId,
        type: data.type,
      });
    } catch {
      const data = await requestVonage();

      setLoginData({
        ...LoginData,
        showCodeInput: true,
        requestId: data.requestId,
        type: data.type,
      });
    }

    setLoading(false);
  };

  const verifyFire = async () => {
    const res = await fetch("/api/fire/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        otp: LoginData.otp.join(""),
        requestId: LoginData.requestId
      })
    });

    if (res.status !== 200) {
      setLoading(false);
      return alert("Internal server error");
    }

    const data = await res.json();
    if (!data.success) {
      setLoading(false);
      return alert(data.error);
    }

    router.push("/feed");
  };

  const verifyVonage = async () => {
    const res = await fetch("/api/vonage/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        otp: LoginData.otp.join(""),
        requestId: LoginData.requestId
      })
    });

    if (res.status !== 200) {
      setLoading(false);
      return alert("Internal server error");
    }

    const data = await res.json();
    if (!data.success) {
      setLoading(false);
      return alert(data.error);
    }

    router.push("/feed");
  };

  const verifyOTP = async () => {
    setLoading(true);

    if (LoginData.type === "fire") {
      verifyFire();
    } else {
      verifyVonage();
    }
  };

  return (
    <div className="flex flex-col gap-y-2">
      <h1 className="text-xl font-medium">Login with your phone number</h1>
      {
        LoginData.showCodeInput ? (<>
          <div className="flex justify-between">
            {
              (new Array(6)).fill(0).map((_, i) => (
                <input
                  key={i}
                  type="number"
                  className={`
                    w-12 h-12 bg-white/5 rounded-lg
                    text-center text-white text-2xl font-medium transition-all
                    focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                    focus:ring-2 focus:ring-white/20 outline-none
                  `}
                  min={0}
                  disabled={Loading}
                  value={LoginData.otp?.[i] || ""}
                  max={9}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace") {
                      setLoginData({
                        ...LoginData,
                        otp: [
                          ...LoginData.otp.slice(0, i),
                          "",
                          ...LoginData.otp.slice(i + 1)
                        ]
                      });

                      const previousSibling = e.target.previousSibling;
                      if (previousSibling) {
                        previousSibling.focus();
                      }
                    } else if (e.key === "ArrowLeft") {
                      const previousSibling = e.target.previousSibling;
                      if (previousSibling) {
                        previousSibling.focus();
                      }
                    } else if (e.key === "ArrowRight") {
                      const nextSibling = e.target.nextSibling;
                      if (nextSibling) {
                        nextSibling.focus();
                      }
                    } else if (!Number.isNaN(Number(e.key))) {
                      const nextSibling = e.target.nextSibling;
                      if (nextSibling) {
                        nextSibling.focus();
                      } else {
                        e.target.blur();
                        setTimeout(() => {
                          verifyOtpButtonRef.current.focus();
                        }, 100);
                      }

                      setLoginData({
                        ...LoginData,
                        otp: [
                          ...LoginData.otp.slice(0, i),
                          e.key,
                          ...LoginData.otp.slice(i + 1)
                        ]
                      });
                    }
                  }}
                />
              ))
            }
          </div>

          <button
            ref={verifyOtpButtonRef}
            className={`
              px-4 py-2 bg-white/5 rounded-lg transition-all
              disabled:opacity-50 disabled:cursor-not-allowed mt-2
              focus:ring-2 focus:ring-white/20 outline-none
            `}
            disabled={LoginData.otp.join("")?.length !== 6 || Loading}
            onClick={verifyOTP}
          >
            {Loading ? "Loading..." : "Verify code"}
          </button>
        </>) : (<>
          <PhoneInput
            placeholder="Enter a phone number"
            value={LoginData.phoneNumber}
            disabled={Loading}
            onChange={(v) => {
              setLoginData({
                ...LoginData,
                phoneNumber: v,
              });
            }}
            addInternationalOption={false}
            defaultCountry="IT"
            className="flex px-4 py-2 bg-white/5 rounded-lg"
            numberInputProps={{
              className: "w-full bg-transparent ml-2 focus:outline-none text-white placeholder-white/50"
            }}
          />

          <button
            className={`
              px-4 py-2 bg-white/5 rounded-lg transition-all
              disabled:opacity-50 disabled:cursor-not-allowed mt-2
              focus:ring-2 focus:ring-white/20 outline-none
            `}
            disabled={!isValidPhoneNumber(LoginData.phoneNumber || "") || Loading}
            onClick={requestOTP}
          >
            {Loading ? "Loading..." : "Send code"}
          </button>
        </>)
      }

      <h2 className="text-xl font-bold mt-4">
        What's BeUnblurred?
      </h2>

      <p className="text-white/75">
        BeUnblurred is a custom BeReal client that lets you see your friends' BeReals without posting one.
      </p>
      <p className="text-white/75 font-bold">
        BeUnblurred is not affiliated with BeReal SAS in any way.
      </p>

      <h2 className="text-xl font-bold mt-4">
        Why do I need to login?
      </h2>
      <p className="text-white/75">
        BeUnblurred needs to log in to your account to retrieve your friends on BeReal.
      </p>
      <p className="text-white/75">
        If you're not comfortable with that, you can check out{" "}

        <a
          href="/github"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dashed hover:opacity-75 transition-all"
        >
          the source code on GitHub
        </a>, or, of course, you can always use the official BeReal app.
      </p>

      <h2 className="text-xl font-bold mt-4">
        Found a bug, or want a feature to be added?
      </h2>
      <p className="text-white/75">
        Feel free to open an issue on{" "}
        <a
          href="/github"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dashed hover:opacity-75 transition-all"
        >
          GitHub
        </a>, or if you're more tech savvy, you can fork the repository and open a pull request.
      </p>

      <h2 className="text-xl font-bold mt-4">
        Why doesn't BeUnblurred have all the features of BeReal?
      </h2>
      <p className="text-white/75">
        BeUnblurred is a side project, and it takes time to reverse engineer the BeReal app and implement all the latest features, so you'll have to be patient for when a new feature is added.
      </p>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const requiredCookies = [
    "token",
    "refreshToken",
    "tokenType",
    "tokenExpiration"
  ];

  if (!requiredCookies.map(n => hasCookie(n, { req, res })).includes(false)) {
    return {
      redirect: {
        destination: "/feed",
        permanent: false
      }
    };
  }

  return { props: {} };
}