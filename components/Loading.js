import { Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function Loading({
    show
}) {
    return (<>
        <Transition
            as={Fragment}
            show={show}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            <div
                className="fixed inset-0 bg-black z-[1030] grid"
            >
                <div className="m-auto">
                    <h1 className="text-4xl font-bold animate-pulse duration-100">
                        BeUnblurred.
                    </h1>
                </div>
            </div>
        </Transition>
    </>);
};