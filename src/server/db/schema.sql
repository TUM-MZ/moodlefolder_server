create table moodleuser (
  id bigserial primary key,
  lrzid text not null,
  email text not null
);

create table course (
  id bigserial primary key,
  moodleid integer unique not null,
  url text not null,
  longtitle text not null,
  shorttitle text not null,
  powerfolderid text not null,
);

create table user_course (
  userid bigserial references moodleuser(id),
  courseid bigserial references course(id),
  created timestamp not null
);

create table resource (
  id serial primary key,
  url text unique not null,
  title text not null,
  resPath text not null,
  lastmodified timestamp not null,
  courseid bigserial references course(moodleid)
);
