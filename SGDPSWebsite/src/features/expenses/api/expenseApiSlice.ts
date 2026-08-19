import { baseApi } from '../../../app/api/baseApi';
import { Expense, CreateExpenseInput, ExpenseFilterParams, ExpenseCategorySummary } from '../types';

export const expenseApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query<Expense[], ExpenseFilterParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              queryParams.append(key, String(value));
            }
          });
        }
        return `/expenses?${queryParams.toString()}`;
      },
      providesTags: ['Expenses'],
    }),
    getExpenseCategorySummary: builder.query<ExpenseCategorySummary[], void>({
      query: () => '/expenses/category-summary',
      providesTags: ['Expenses'],
    }),
    createExpense: builder.mutation<Expense, CreateExpenseInput>({
      query: (body) => ({
        url: '/expenses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Expenses', 'Dashboard', 'Reports'],
    }),
    updateExpense: builder.mutation<Expense, { id: number; data: import('../types').UpdateExpenseInput }>({
      query: ({ id, data }) => ({
        url: `/expenses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Expenses', 'Dashboard', 'Reports'],
    }),
    deleteExpense: builder.mutation<void, number>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Expenses', 'Dashboard', 'Reports'],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseCategorySummaryQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expenseApiSlice;
