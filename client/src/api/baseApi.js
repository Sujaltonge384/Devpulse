
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl:
    import.meta.env.VITE_API_URL || "http://localhost:5000/api",

  credentials: "include",

  prepareHeaders: (headers) => {
    const token = localStorage.getItem("devpulse_token");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,

  tagTypes: [
    "User",
    "Project",
    "Task",
    "Dashboard",
    "Notification",
    "Activity",
    "Team",
    "GitHub",
  ],

  endpoints: (builder) => ({
    // Authentication
    getMe: builder.query({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),

    login: builder.mutation({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "User",
        "Dashboard",
        "Project",
        "Task",
      ],
    }),

    register: builder.mutation({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: [
        "User",
        "Dashboard",
        "Project",
        "Task",
      ],
    }),

    // Projects
    getProjects: builder.query({
      query: () => "/projects",
      transformResponse: (response) => response.data.projects,
      providesTags: ["Project"],
    }),

    createProject: builder.mutation({
      query: (body) => ({
        url: "/projects",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Project", "Dashboard"],
    }),

    updateProject: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/projects/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Project", "Dashboard"],
    }),

    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Project", "Task", "Dashboard"],
    }),

    // Tasks
    getTasks: builder.query({
      query: (params = {}) => ({
        url: "/tasks",
        params,
      }),
      transformResponse: (response) => response.data.tasks,
      providesTags: ["Task"],
    }),

    createTask: builder.mutation({
      query: (body) => ({
        url: "/tasks",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Task", "Project", "Dashboard"],
    }),

    updateTask: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/tasks/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Task", "Project", "Dashboard"],
    }),

    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Task", "Project", "Dashboard"],
    }),

    // Dashboard
    getDashboard: builder.query({
      query: () => "/dashboard",
      transformResponse: (response) => response.data,
      providesTags: ["Dashboard", "Task", "Project"],
    }),

    // Health
    getHealth: builder.query({
      query: () => "/health",
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetDashboardQuery,
  useGetHealthQuery,
} = baseApi;
