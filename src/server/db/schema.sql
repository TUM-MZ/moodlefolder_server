create table moodleuser (
  id bigserial primary key,
  lrzid text,
  email text
);

create table course (
  id bigserial primary key,
  moodleid integer,
  url text,
  longtitle text,
  shorttitle text
);

create table user_course (
  userid bigserial references moodleuser(id),
  courseid bigserial references course(id),
  created timestamp
);

create table resource (
  id bigserial primary key,
  url text,
  title text,
  resPath text,
  courseid bigserial references course(id)
);
