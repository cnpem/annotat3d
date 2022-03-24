import {useEffect} from "react";

interface Dictionary<T> {
    [Key: string]: T;
}

interface Subscriber {
    event: string;
    callback: (payload: any) => void;
}

const subscribers: Dictionary<Subscriber[]> = {};

function subscribe(evt: string, callback: (payload: any) => void) {
    const newSub: Subscriber = { event: evt, callback: callback };
    const curSubs = subscribers[evt] || [];
    subscribers[evt] = [...curSubs, newSub];
}

function unsubscribe(evt: string, callback: (payload: any) => void) {
    const curSubs = subscribers[evt] || [];
    subscribers[evt] = curSubs.filter(sub => sub.callback !== callback);
}

function dispatch(evt: string, payload: any) {
    const curSubs = subscribers[evt] || [];
    curSubs.forEach(sub => {
        sub.callback(payload);
    });
}

function useEventBus(evt: string, callback: (payload: any) => void) {
    useEffect(() => {
    
        subscribe(evt, callback); // run on mount

        return () => {
          unsubscribe(evt, callback); // run on unmount
        }
      }, []);
}

export {subscribe, unsubscribe, dispatch, useEventBus};
