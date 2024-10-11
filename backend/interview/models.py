from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, userid, email, password=None):
        if not email:
            raise ValueError("Users must have an email address")
        if not userid:
            raise ValueError("Users must have a user ID")

        email = self.normalize_email(email)
        user = self.model(userid=userid, email=email)
        user.set_password(password)  # Hash the password
        user.save(using=self._db)
        return user

    def create_superuser(self, userid, email, password):
        user = self.create_user(userid, email, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

class Users(AbstractBaseUser):
    userid = models.CharField(max_length=30, primary_key=True)
    email = models.EmailField(max_length=50,unique=True)
    password = models.CharField(max_length=128)

    USERID_FIELD = 'userid'
    REQUIRED_FIELDS = ['email','password']

    objects = UserManager()

    def __str__(self):
        return self.userid

class Module(models.Model):
    moduleid=models.CharField(max_length=30, primary_key=True)
    modulename = models.CharField(max_length=30)
    prompt = models.TextField(max_length=1000)
    voice = models.CharField(max_length=50)
    system_prompt = models.TextField(max_length=1000)
    case_abstract = models.TextField(max_length=200)
    file = models.TextField(max_length=200, null=True, blank=True)
    model = models.CharField(max_length=50)

    def __str__(self):
        return self.moduleid

class Admin(models.Model):
    adminid=models.CharField(max_length=30, primary_key=True)
    userid = models.ForeignKey(Users, on_delete=models.CASCADE)
    moduleid = models.ForeignKey(Module, on_delete=models.CASCADE)
    email = models.EmailField(max_length=50)
    password = models.CharField(max_length=50)

    def __str__(self):
        return f"Admin: {self.user.adminid}"

class Interview(models.Model):
    interviewid = models.AutoField(primary_key=True)
    userid = models.ForeignKey(Users, on_delete=models.CASCADE)
    moduleid = models.ForeignKey(Module, on_delete=models.CASCADE)
    dateactive = models.DateTimeField()
    interviewlength = models.DurationField()
    transcript = models.TextField()
    def __str__(self):
        return f"Interview {self.interviewid}"
