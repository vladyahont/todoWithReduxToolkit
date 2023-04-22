import {appActions, RequestStatusType} from 'app/app-reducer'
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {clearTasksAndTodos} from "features/TodolistsList/Todolist/additionalActions";
import {createAppAsyncThunk, handleServerAppError, handleServerNetworkError} from "common/utils";
import {ChangeTodoTitleArgType, todolistsAPI, TodolistType} from "features/TodolistsList/Todolist/todolists.api";
import {ResultCode} from "common/enums/emuns";

const initialState: TodolistDomainType[] = []

const fetchTodolists = createAppAsyncThunk<{ todos: TodolistType[] }, void>
('todo/fetchTodolists', async (_, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: 'loading'}))
        const res = await todolistsAPI.getTodolists()
        dispatch(appActions.setAppStatus({status: 'succeeded'}))
        return {todos: res.data}
    } catch (e) {
        handleServerNetworkError(e, dispatch)
        return rejectWithValue(null)
    }
})

const addTodolist = createAppAsyncThunk<{ todolist: TodolistType }, {title: string}>
('todo/addTodolist', async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: 'loading'}))
        const res = await todolistsAPI.createTodolist(arg.title)
        if (res.data.resultCode === ResultCode.Success) {
            dispatch(appActions.setAppStatus({status: 'succeeded'}))
            return {todolist: res.data.data.item}
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue(null)
        }
    } catch (e) {
        handleServerNetworkError(e, dispatch)
        return rejectWithValue(null)
    }
})

const removeTodolist = createAppAsyncThunk<{todolistId: string}, { todolistId: string }>
('todo/removeTodolist', async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: 'loading'}))
        dispatch(todolistsActions.changeTodolistEntityStatus({id: arg.todolistId, entityStatus: 'loading'}))
        const res = await todolistsAPI.deleteTodolist(arg.todolistId)
        if (res.data.resultCode === ResultCode.Success) {
            dispatch(appActions.setAppStatus({status: 'succeeded'}))
            return {todolistId: arg.todolistId}
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue(null)
        }
    } catch (e) {
        handleServerNetworkError(e, dispatch)
        return rejectWithValue(null)
    }
})

const changeTodolistTitle = createAppAsyncThunk<ChangeTodoTitleArgType, ChangeTodoTitleArgType>
('todo/changeTodolistTitle', async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: 'loading'}))
        const res = await todolistsAPI.updateTodolist(arg)
        if (res.data.resultCode === ResultCode.Success) {
            dispatch(appActions.setAppStatus({status: 'succeeded'}))
            return arg
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue(null)
        }
    } catch (e) {
        handleServerNetworkError(e, dispatch)
        return rejectWithValue(null)
    }
})


const slice = createSlice({
    name: 'todo',
    initialState,
    reducers: {
        changeTodolistFilter: (state, action: PayloadAction<{ id: string, filter: FilterValuesType }>) => {
            // const index = state.findIndex(todol => todol.id === action.payload.id)
            // if (index !== -1) state[index].filter = action.payload.filter
            const todo = state.find(todo => todo.id === action.payload.id)
            if (todo) todo.filter = action.payload.filter
        },
        changeTodolistEntityStatus: (state, action: PayloadAction<{ id: string, entityStatus: RequestStatusType }>) => {
            // const index = state.findIndex(todol => todol.id === action.payload.id)
            // if (index !== -1) state[index].entityStatus = action.payload.status
            const todo = state.find(todo => todo.id === action.payload.id)
            if (todo) todo.entityStatus = action.payload.entityStatus
        }
    },
    extraReducers: builder => {
        builder
            .addCase(fetchTodolists.fulfilled, (state, action) => {
                return action.payload.todos.map(todo => ({...todo, filter: 'all', entityStatus: 'idle'}))
            })
            .addCase(addTodolist.fulfilled, (state, action) => {
                const newTodo: TodolistDomainType = {...action.payload.todolist, filter: 'all', entityStatus: 'idle'}
                state.unshift(newTodo)
            })
            .addCase(removeTodolist.fulfilled, (state, action) => {
                const index = state.findIndex(todo => todo.id === action.payload.todolistId)
                if (index !== -1) state.splice(index, 1)
            })
            .addCase(changeTodolistTitle.fulfilled, (state, action) => {
                const todo = state.find(todo => todo.id === action.payload.todolistId)
                if (todo) todo.title = action.payload.title
            })
            .addCase(clearTasksAndTodos, () => {
                return []
            })
    }
})


export const todolistsReducer = slice.reducer
export const todolistsActions = slice.actions
export const todosThunks = {fetchTodolists, addTodolist, removeTodolist, changeTodolistTitle}


export type FilterValuesType = 'all' | 'active' | 'completed';
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType
    entityStatus: RequestStatusType
}

