export function groupBy<T>(array: T[], predicate: (v: T) => string) {
    return array.reduce((acc, value) => {
        (acc[predicate(value)] ||= []).push(value);
        return acc;
    }, {} as { [key: string]: T[] });
}