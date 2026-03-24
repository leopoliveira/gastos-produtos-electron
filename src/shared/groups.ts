export interface ICreateGroup {
  name: string;
  description?: string;
}

export type IUpdateGroup = ICreateGroup;

export interface IReadGroup extends IUpdateGroup {
  id: string;
}
