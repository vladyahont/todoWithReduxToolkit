import {createAction} from "@reduxjs/toolkit";
import {TasksStateType} from "features/TodolistsList/tasks-reducer";
import {TodolistDomainType} from "features/TodolistsList/todolists-reducer";

export type ClearTasksAndTodosType = {
    tasks: TasksStateType,
    todolists: TodolistDomainType[]
}

export const clearTasksAndTodos = createAction<ClearTasksAndTodosType>('common/clear-tasks-todos')