-- Phase 7: study planner

alter table courses
  add column if not exists exam_date date;
