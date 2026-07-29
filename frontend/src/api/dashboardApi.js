import{request}from'./http';export const getRoleDashboard=role=>request(`/${role}/dashboard`);
