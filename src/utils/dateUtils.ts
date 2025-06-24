export const isNewDay = (lastSessionDate: string | null): boolean => {
    if (!lastSessionDate) return true;

    const today = new Date().toDateString();
    const lastDate = new Date(lastSessionDate).toDateString();

    return today !== lastDate;
};

export const getCurrentDateString = (): string => {
    return new Date().toISOString();
};
