export interface GroupWriteDto {
  name: string;
  description?: string;
}

export interface AddGroupRequest extends GroupWriteDto {}

export interface AddGroupResponse {
  id: string;
}

export interface GroupResponse extends GroupWriteDto {
  id: string;
}

export type ICreateGroup = AddGroupRequest;
export type IUpdateGroup = GroupWriteDto;
export type IReadGroup = GroupResponse;
