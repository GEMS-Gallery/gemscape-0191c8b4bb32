import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export interface Shape {
  'x' : number,
  'y' : number,
  'id' : bigint,
  'endX' : [] | [number],
  'endY' : [] | [number],
  'color' : string,
  'size' : number,
  'shapeType' : string,
}
export interface _SERVICE {
  'addShape' : ActorMethod<
    [string, number, number, string, number, [] | [number], [] | [number]],
    Result_1
  >,
  'clearCanvas' : ActorMethod<[], Result>,
  'deleteShape' : ActorMethod<[bigint], Result>,
  'getCanvas' : ActorMethod<[], Array<Shape>>,
  'updateCanvas' : ActorMethod<[Array<Shape>], Result>,
  'updateShape' : ActorMethod<
    [bigint, number, number, number, [] | [number], [] | [number]],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
