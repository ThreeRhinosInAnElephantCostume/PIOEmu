import internal from "stream";

export interface IUser
{
    name: string;
    password: string;
};

export interface IProject
{
    id: number;
    name: string;
    user: string;
    javascript: string;
    pio: string;
    public: boolean;
};