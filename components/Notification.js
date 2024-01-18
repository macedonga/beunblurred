import { Fragment, useEffect, useState } from "react";

import { Transition } from "@headlessui/react";
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/20/solid";

export default function Notification({ message, show, exit, timeout, type, top }) {
    const types = {
        "success": {
            icon: CheckCircleIcon,
            color: "text-green-500",
        },
        "error": {
            icon: XMarkIcon,
            color: "text-red-500",
        },
        "info": {
            icon: InformationCircleIcon,
            color: "text-blue-500",
        },
        "warning": {
            icon: ExclamationCircleIcon,
            color: "text-yellow-500",
        },
    };

    const [Timeout, setTimeoutO] = useState(null);
    const [IconType, setIconType] = useState(types[type] || null);

    useEffect(() => {
        if (timeout && show) {
            if (Timeout) clearTimeout(Timeout);

            let t = setTimeout(() => {
                exit();
            }, (timeout * 1000));

            setTimeoutO(t);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    useEffect(() => {
        setIconType(types[type] || null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    return (<>
        <Transition
            as={Fragment}
            show={show}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
        >
            <div className={`fixed ${top ? "top-[1rem]" : "bottom-[1rem]"} left-[50%] translate-x-[-50%] md:w-auto w-full z-[99999] px-8`}>
                <div
                    className="border flex border-white/10 bg-[#0d0d0d] rounded-lg shadow-lg py-4 px-6"
                >
                    <p className="inline-flex my-auto justify-center items-center flex-grow">
                        {IconType && (
                            <span className={`${IconType.color} flex items-center mr-4`}>
                                <IconType.icon className={"w-6 h-6"} />
                            </span>
                        )}
                        <span className="my-auto">
                            {message}
                        </span>
                    </p>
                </div>
            </div>
        </Transition>
    </>);
};