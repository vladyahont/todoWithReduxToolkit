import {TaskPriorities, TaskStatuses} from "common/enums/emuns";
import {UpdateDomainTaskModelType} from "features/Tasks/tasks-reducer";
import axios from 'axios'

export const instance = axios.create({
    baseURL: 'https://social-network.samuraijs.com/api/1.1/',
    withCredentials: true,
    headers: {
        'API-KEY': '8187dba0-82b2-4e16-acfc-76b2ac205830'
    }
})

export const todolistsAPI = {
    getTodolists() {
        return instance.get<TodolistType[]>('todo-lists');
    },
    createTodolist(title: string) {
        return instance.post<ResponseType<{ item: TodolistType }>>('todo-lists', {title: title});
    },
    deleteTodolist(id: string) {
        return instance.delete<ResponseType>(`todo-lists/${id}`);
    },
    updateTodolist(arg: ChangeTodoTitleArgType) {
        return instance.put<ResponseType>(`todo-lists/${arg.todolistId}`, {title: arg.title});
    },
    getTasks(todolistId: string) {
        return instance.get<GetTasksResponse>(`todo-lists/${todolistId}/tasks`);
    },
    deleteTask(arg: RemoveTaskArgType) {
        return instance.delete<ResponseType>(`todo-lists/${arg.todolistId}/tasks/${arg.taskId}`);
    },
    createTask(arg: AddTaskArgType) {
        return instance.post<ResponseType<{ item: TaskType}>>(`todo-lists/${arg.todolistId}/tasks`, {title: arg.title});
    },
    updateTask(todolistId: string, taskId: string, model: UpdateTaskModelType) {
        return instance.put<ResponseType<TaskType>>(`todo-lists/${todolistId}/tasks/${taskId}`, model);
    }
}

type FieldErrorType = {
    error: string
    field: string
}

export type ResponseType<D = {}> = {
    resultCode: number
    messages: string[]
    data: D
    fieldsErrors: FieldErrorType[]
}

type GetTasksResponse = {
    error: string | null
    totalCount: number
    items: TaskType[]
}
export type TodolistType = {
    id: string
    title: string
    addedDate: string
    order: number
}


export type TaskType = {
    description: string
    title: string
    status: TaskStatuses
    priority: TaskPriorities
    startDate: string
    deadline: string
    id: string
    todoListId: string
    order: number
    addedDate: string
}
export type UpdateTaskModelType = {
    title: string
    description: string
    status: TaskStatuses
    priority: TaskPriorities
    startDate: string
    deadline: string
}


export type AddTaskArgType = {
    title: string,
    todolistId: string
}

export type UpdateTaskArgType = {
    todolistId: string,
    taskId: string,
    domainModel: UpdateDomainTaskModelType
}
export type RemoveTaskArgType = {
    taskId: string
    todolistId: string
}
export type ChangeTodoTitleArgType = {
    todolistId: string
    title: string
}