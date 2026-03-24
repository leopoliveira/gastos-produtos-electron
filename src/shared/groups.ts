export interface ICreateGroup {
  name: string;
}

export interface IReadGroup extends ICreateGroup {
  id: string;
}
