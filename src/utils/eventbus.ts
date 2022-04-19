/**
 * @Author Peixinho
 * This library was inspired by https://github.com/fabienjuif/use-bus
 * @date The year of 2022, my last year at LNLS, I will miss you boys.
 */
/*
 * And to you that have adventured on unknown territories of structural architectural functions.
 * I salute you, the world survives thanks to brave people like you.
 * But there is also a chance no one will touch these functions, in this case I am speaking for no one and therefore should stop now,
 * or people might think I am crazy. Even tough I am a little.
 */

import { useEffect } from "react";

interface Dictionary<T> {
    [Key: string]: T;
}

interface Subscriber {
    event: string;
    callback: (payload: any) => void;
}

const subscribers: Dictionary<Subscriber[]> = {};

const currentValue: Dictionary<any> = {};

/**
 * Subscribe to listen to the defined event.
 * @param evt: Event descriptor (can be any string)
 * @param callback: The operation to be performed when the event occurs. A payload of information is passed as parameter.
 */
function subscribe(evt: string, callback: (payload: any) => void) {
    const newSub: Subscriber = { event: evt, callback: callback };
    const curSubs = subscribers[evt] || [];
    subscribers[evt] = [...curSubs, newSub];
    console.log('subscribe');
}

/**
 * Unsubscribe to an event.
 * @param evt: Event descriptor.
 * @param callback: The callback previously registered.
 */
function unsubscribe(evt: string, callback: (payload: any) => void) {
    const curSubs = subscribers[evt] || [];
    subscribers[evt] = curSubs.filter(sub => sub.callback !== callback);
    console.log('unsubscribe');
}

/**
 * Triggers the callback functions registered to listen to the given event.
 * @param evt: Event descriptor (can be any string)
 * @param payload: The payload of information to be passed as parameter to the invoked callback functions.
 */
function dispatch(evt: string, payload: any) {
    const curSubs = subscribers[evt] || [];
    curSubs.forEach(sub => {
        sub.callback(payload);
    });
    currentValue[evt] = payload;
}

/**
 * React hook to subscribe/unsubscribe to an event on component mount/umount.
 * @param evt: Event descriptor (can be any string)
 * @param callback: The operation to be performed when the event occurs. A payload of information is passed as parameter.
 */
function useEventBus(evt: string, callback: (payload: any) => void) {
    useEffect(() => {

        subscribe(evt, callback); // run on mount

        return () => {
            unsubscribe(evt, callback); // run on unmount
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

function currentEventValue(evt: string): any | null {
    const cur = currentValue[evt] || null;
    return cur;
}

export { subscribe, unsubscribe, dispatch, useEventBus, currentEventValue };
